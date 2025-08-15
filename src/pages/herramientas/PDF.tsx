import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, FileText } from "lucide-react";

const PDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    // Placeholder: simula conversión
    setTimeout(() => {
      setResultUrl(URL.createObjectURL(new Blob(["PDF DEMO"], { type: "application/pdf" })));
      setLoading(false);
    }, 800);
  };

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Convertir a PDF</h1>
      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-3">
        <div className="flex items-center gap-2">
          <Input type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={handleConvert} disabled={!file || loading} className="rounded-lg">
            <FileUp className="h-4 w-4 mr-2" /> {loading ? "Convirtiendo..." : "Convertir"}
          </Button>
        </div>
        {resultUrl && (
          <a href={resultUrl} download="archivo.pdf" className="text-sm text-blue-600 underline inline-flex items-center gap-1">
            <FileText className="h-4 w-4" /> Descargar PDF
          </a>
        )}
      </Card>
    </div>
  );
};

export default PDF;


