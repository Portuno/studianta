import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, FileText } from "lucide-react";

const Resumenes = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    // Placeholder: simula un resumen
    setTimeout(() => {
      setSummary("Resumen generado (demostración): " + text.slice(0, 140) + (text.length > 140 ? "..." : ""));
      setLoading(false);
    }, 800);
  };

  return (
    <div className="px-4 py-5 pb-24 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Generador de Resúmenes</h1>

      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí tu texto o notas..."
          className="min-h-[160px]"
        />
        <div className="flex justify-end">
          <Button onClick={handleSummarize} disabled={loading || !text.trim()} className="rounded-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? "Resumiendo..." : "Generar Resumen"}
          </Button>
        </div>
      </Card>

      {summary && (
        <Card className="p-4 rounded-2xl border-0 bg-amber-50">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-700 mt-0.5" />
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{summary}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Resumenes;


