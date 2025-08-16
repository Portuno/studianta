import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, FileQuestion, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type ExamType = "tf" | "mcq" | "fill" | "match" | "essay";

export default function Examenes() {
  const { user } = useAuth();
  const [subjectId, setSubjectId] = useState<string>("");
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [examType, setExamType] = useState<ExamType>("mcq");
  const [prompt, setPrompt] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("subjects")
        .select("id,name")
        .eq("user_id", user.id)
        .order("name");
      setSubjects((data || []) as any);
    };
    load();
  }, [user]);

  const canGenerate = useMemo(() => !!user && (!!subjectId || prompt.trim().length > 0), [user, subjectId, prompt]);

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Generador de Exámenes</h1>

      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asignatura (opcional)</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sin asignatura (usa prompt o PDF)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de examen</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
            >
              <option value="tf">Verdadero / Falso</option>
              <option value="mcq">Opción Múltiple</option>
              <option value="fill">Rellenar espacios</option>
              <option value="match">Relacionar conceptos</option>
              <option value="essay">Desarrollo (ensayo)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad de preguntas</label>
            <Input type="number" min={1} max={50} value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value || "0", 10))} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt / Indicaciones (opcional)</label>
          <Textarea
            placeholder="Ej.: Enfocar en la Unidad 3: Neuronas y Sinapsis."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button disabled className="rounded-lg" title="Adjuntar PDF (próximo)">
            <Upload className="h-4 w-4 mr-2" /> Adjuntar PDF
          </Button>
          <Button
            onClick={async () => {
              if (!canGenerate) return;
              setLoading(true);
              // Placeholder: simulación. Conectar a Edge Function/IA en siguiente etapa.
              setTimeout(() => {
                const sample = `Tipo: ${examType}\nPreguntas: ${numQuestions}\nFuente: ${subjectId ? `Asignatura ${subjectId}` : prompt ? "Prompt" : "N/A"}\n\n1) Ejemplo de pregunta...`;
                setResult(sample);
                setLoading(false);
              }, 800);
            }}
            disabled={!canGenerate || loading}
            className="rounded-lg"
          >
            <FileQuestion className="h-4 w-4 mr-2" /> {loading ? "Generando..." : "Generar Examen"}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" /> Vista previa
          </div>
          <pre className="whitespace-pre-wrap text-sm text-foreground">{result}</pre>
        </Card>
      )}
    </div>
  );
}


