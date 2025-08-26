// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cloudconvertApiKey = Deno.env.get("CLOUDCONVERT_API_KEY");

if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase service envs");
if (!cloudconvertApiKey) console.warn("Missing CLOUDCONVERT_API_KEY. Conversion will fail.");

const getExt = (path: string) => {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx + 1).toLowerCase() : "";
};

const guessInputFormat = (ext: string) => {
  const map: Record<string, string> = {
    doc: "doc",
    docx: "docx",
    txt: "txt",
    rtf: "rtf",
    odt: "odt",
    xls: "xls",
    xlsx: "xlsx",
    csv: "csv",
    ods: "ods",
    ppt: "ppt",
    pptx: "pptx",
    odp: "odp",
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    gif: "gif",
    tif: "tiff",
    tiff: "tiff",
    pdf: "pdf",
  };
  return map[ext] || "";
};

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { source_bucket = "study-materials", source_path, dest_folder = "converted" } = body as { source_bucket?: string; source_path?: string; dest_folder?: string };
    if (!source_path) return new Response(JSON.stringify({ error: "Missing source_path" }), { status: 400 });

    // Enforce that user only converts files under their folder
    if (!source_path.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden path" }), { status: 403 });
    }

    const ext = guessInputFormat(getExt(source_path));
    if (!ext) return new Response(JSON.stringify({ error: "Unsupported file type" }), { status: 400 });

    if (ext === "pdf") {
      // Already PDF, just return a signed URL
      const { data: signed } = await supabase.storage.from(source_bucket).createSignedUrl(source_path, 60 * 10);
      return new Response(JSON.stringify({ status: "already_pdf", source: { bucket: source_bucket, path: source_path, url: signed?.signedUrl } }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (!cloudconvertApiKey) return new Response(JSON.stringify({ error: "Missing CLOUDCONVERT_API_KEY" }), { status: 500 });

    // Create a signed URL for CloudConvert to fetch the source file
    const { data: signed } = await supabase.storage.from(source_bucket).createSignedUrl(source_path, 60 * 30);
    if (!signed?.signedUrl) return new Response(JSON.stringify({ error: "Failed to sign source file" }), { status: 500 });

    const jobPayload = {
      tasks: {
        "import-1": { operation: "import/url", url: signed.signedUrl },
        "convert-1": { operation: "convert", input: "import-1", output_format: "pdf" },
        "export-1": { operation: "export/url", input: "convert-1" }
      }
    };

    const createJobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { "Authorization": `Bearer ${cloudconvertApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(jobPayload)
    });
    if (!createJobRes.ok) {
      const text = await createJobRes.text();
      return new Response(JSON.stringify({ error: "Failed to create job", details: text }), { status: 502 });
    }

    const created = await createJobRes.json();
    const jobId = created?.data?.id as string | undefined;
    if (!jobId) return new Response(JSON.stringify({ error: "Invalid job response" }), { status: 502 });

    // Poll job until finished (simple backoff)
    const pollJob = async () => {
      for (let i = 0; i < 30; i++) {
        const res = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, { headers: { Authorization: `Bearer ${cloudconvertApiKey}` } });
        if (!res.ok) throw new Error("Failed to poll job");
        const json = await res.json();
        const status = json?.data?.status as string | undefined;
        if (status === "finished") return json;
        if (status === "error" || status === "failed" || status === "canceled") throw new Error(`Job status: ${status}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error("Conversion timed out");
    };

    const finalJob = await pollJob();
    const tasks = (finalJob?.data?.tasks ?? []) as any[];
    const exportTask = tasks.find((t) => t.operation === "export/url" && t.status === "finished");
    const fileUrl = exportTask?.result?.files?.[0]?.url as string | undefined;
    if (!fileUrl) return new Response(JSON.stringify({ error: "No export URL" }), { status: 502 });

    // Download the resulting PDF
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return new Response(JSON.stringify({ error: "Failed to download result" }), { status: 502 });
    const arrayBuffer = await fileRes.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    const originalName = source_path.split("/").pop()!;
    const destFileName = `${originalName}.pdf`;
    const destPath = `${user.id}/${dest_folder}/${destFileName}`;

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage.from(source_bucket).upload(destPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) return new Response(JSON.stringify({ error: "Upload failed", details: upErr.message }), { status: 502 });

    const { data: destSigned } = await supabase.storage.from(source_bucket).createSignedUrl(destPath, 60 * 60);

    return new Response(JSON.stringify({
      status: "ok",
      source: { bucket: source_bucket, path: source_path },
      dest: { bucket: source_bucket, path: destPath, url: destSigned?.signedUrl }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("convert-to-pdf error", err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}); 