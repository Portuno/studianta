import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const PDF = () => {
  const { user, session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [downloadName, setDownloadName] = useState<string>("archivo.pdf");

  const handleConvert = async () => {
    if (!file || !user || !session?.access_token) return;
    setLoading(true);
    setErrorMsg("");
    setResultUrl("");

    try {
      const path = `${user.id}/conversions/source/${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("study-materials")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("convert-to-pdf", {
        body: { source_bucket: "study-materials", source_path: path, dest_folder: "converted" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error as any;

      const url = (data as any)?.dest?.url as string | undefined;
      if (!url) throw new Error("No se pudo obtener el enlace del PDF generado");
      setDownloadName(`${file.name}.pdf`);
      setResultUrl(url);
    } catch (err) {
      setErrorMsg((err as any)?.message || "Error al convertir el archivo a PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Convertir a PDF</h1>
      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept={".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.csv,.ods,.odp,.tif,.tiff,.jpg,.jpeg,.png,.gif," +
              "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
              "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv," +
              "application/rtf,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation,image/tiff,image/jpeg,image/png,image/gif"}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button onClick={handleConvert} disabled={!file || loading || !user} className="rounded-lg">
            <FileUp className="h-4 w-4 mr-2" /> {loading ? "Convirtiendo..." : "Convertir"}
          </Button>
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        {resultUrl && (
          <a href={resultUrl} download={downloadName} className="text-sm text-blue-600 underline inline-flex items-center gap-1">
            <FileText className="h-4 w-4" /> Descargar PDF
          </a>
        )}
        <p className="text-xs text-muted-foreground">
          Soporta: Word (.doc, .docx), Texto (.txt, .rtf, .odt), Excel (.xls, .xlsx, .csv, .ods), PowerPoint (.ppt, .pptx, .odp), Imágenes (.jpg, .jpeg, .png, .gif, .tif, .tiff)
        </p>
      </Card>
    </div>
  );
};

export default PDF;


