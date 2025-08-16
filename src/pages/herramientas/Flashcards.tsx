import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Layers3, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Flashcard = { id: string; term: string; definition: string };

export default function Flashcards() {
  const { user } = useAuth();
  const [subjectId, setSubjectId] = useState<string>("");
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [sourceText, setSourceText] = useState<string>("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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

  const canGenerate = useMemo(() => !!user && (!!subjectId || sourceText.trim().length > 0), [user, subjectId, sourceText]);
  const current = cards[index];

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Creador de Flashcards</h1>

      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asignatura (opcional)</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sin asignatura (usa texto)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Texto fuente (opcional)</label>
            <Textarea
              placeholder="Pega conceptos y definiciones..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              if (!canGenerate) return;
              setLoading(true);
              // Placeholder de IA: genera tarjetas simples desde el texto
              setTimeout(() => {
                const base: Flashcard[] = sourceText
                  ? sourceText
                      .split("\n")
                      .map((line, i) => line.split(":"))
                      .filter((p) => p.length >= 2)
                      .map((p, i) => ({ id: `${Date.now()}-${i}`, term: p[0].trim(), definition: p.slice(1).join(":").trim() }))
                  : [
                      { id: "1", term: "Neurona", definition: "Célula del sistema nervioso que transmite información." },
                      { id: "2", term: "Sinapsis", definition: "Conexión entre neuronas para la comunicación." },
                    ];
                setCards(base);
                setIndex(0);
                setLoading(false);
              }, 800);
            }}
            disabled={!canGenerate || loading}
            className="rounded-lg"
          >
            <Layers3 className="h-4 w-4 mr-2" /> {loading ? "Generando..." : "Generar Flashcards"}
          </Button>
          {cards.length > 0 && (
            <Button variant="outline" className="rounded-lg" onClick={() => { setCards([]); setSourceText(""); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar
            </Button>
          )}
        </div>
      </Card>

      {cards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" /> {index + 1} / {cards.length}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setIndex((i) => Math.max(0, i - 1))}>Anterior</Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}>Siguiente</Button>
            </div>
          </div>

          <Card className="p-8 rounded-2xl border-0 bg-white/90 text-center select-none">
            <div className="text-lg font-semibold mb-3">{current?.term}</div>
            <div className="text-muted-foreground">{current?.definition}</div>
          </Card>
        </div>
      )}
    </div>
  );
}


