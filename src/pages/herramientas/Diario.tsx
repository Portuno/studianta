import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpenCheck, Sparkles } from "lucide-react";

type Entry = { id: string; text: string; date: string };

const Diario = () => {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  const addEntry = () => {
    if (!text.trim()) return;
    setEntries((prev) => [{ id: Date.now().toString(), text, date: new Date().toLocaleString("es-ES") }, ...prev]);
    setText("");
  };

  const organizeAI = () => {
    if (entries.length === 0) return;
    // Placeholder: reordena por longitud como "organización"
    setEntries((prev) => [...prev].sort((a, b) => a.text.length - b.text.length));
  };

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Diario de Estudios</h1>
      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe ideas, reflexiones o preguntas..."
          className="min-h-[120px]"
        />
        <div className="flex items-center gap-2 justify-end">
          <Button onClick={organizeAI} variant="outline" className="rounded-lg">
            <Sparkles className="h-4 w-4 mr-2" /> Organizar con IA
          </Button>
          <Button onClick={addEntry} className="rounded-lg">
            <BookOpenCheck className="h-4 w-4 mr-2" /> Guardar nota
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {entries.map((e) => (
          <Card key={e.id} className="p-3 rounded-2xl border-0 bg-emerald-50">
            <div className="text-[11px] text-emerald-700 mb-1">{e.date}</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{e.text}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Diario;


