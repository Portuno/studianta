import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, BookOpenCheck, Calculator, FileUp } from "lucide-react";

const tools = [
  {
    key: "resumenes",
    title: "Generador de Resúmenes",
    description: "Crea resúmenes rápidos a partir de texto o PDFs.",
    icon: Sparkles,
  },
  {
    key: "pdf",
    title: "Convertidor a PDF",
    description: "Convierte imágenes o documentos en archivos PDF.",
    icon: FileUp,
  },
  {
    key: "diario",
    title: "Diario de Estudios",
    description: "Anota ideas y deja que la IA organice tus notas.",
    icon: BookOpenCheck,
  },
  {
    key: "calculadora",
    title: "Calculadora Científica",
    description: "Operaciones y funciones para ciencias e ingeniería.",
    icon: Calculator,
  },
];

const Herramientas = () => {
  return (
    <div className="px-4 py-5 pb-24">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Herramientas</h1>

      <div className="grid grid-cols-1 gap-3">
        {tools.map((t) => (
          <Card key={t.key} className="p-4 rounded-2xl border-0 shadow-sm bg-white/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <t.icon className="h-5 w-5 text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500">{t.description}</p>
              </div>
              <Button className="rounded-lg">Abrir</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Herramientas;


