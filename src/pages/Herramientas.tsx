import { Card } from "@/components/ui/card";
import { FileText, Sparkles, BookOpenCheck, Calculator, FileUp } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    key: "resumenes",
    to: "/herramientas/resumenes",
    title: "Generador de Resúmenes",
    icon: Sparkles,
    bg: "from-amber-50 to-pink-50 text-amber-800",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    key: "pdf",
    to: "/herramientas/pdf",
    title: "Convertir a PDF",
    icon: FileUp,
    bg: "from-blue-50 to-cyan-50 text-blue-800",
    iconBg: "bg-blue-100 text-blue-700",
  },
  {
    key: "diario",
    to: "/herramientas/diario",
    title: "Diario de Estudios",
    icon: BookOpenCheck,
    bg: "from-emerald-50 to-teal-50 text-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "calculadora",
    to: "/herramientas/calculadora",
    title: "Calculadora Científica",
    icon: Calculator,
    bg: "from-violet-50 to-fuchsia-50 text-violet-800",
    iconBg: "bg-violet-100 text-violet-700",
  },
];

const Herramientas = () => {
  return (
    <div className="px-4 py-5 pb-24">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Herramientas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tools.map((t) => (
          <Link key={t.key} to={t.to} className="block">
            <Card className={`rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
              <div className={`aspect-square bg-gradient-to-br ${t.bg} flex flex-col items-center justify-center gap-2 p-4`}>
                <div className={`w-12 h-12 rounded-xl ${t.iconBg} grid place-items-center`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold leading-tight">{t.title}</h3>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Herramientas;


