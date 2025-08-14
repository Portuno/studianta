import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";

const ops = [
  { k: "+", fn: (a: number, b: number) => a + b },
  { k: "-", fn: (a: number, b: number) => a - b },
  { k: "×", fn: (a: number, b: number) => a * b },
  { k: "÷", fn: (a: number, b: number) => a / b },
];

const Calculadora = () => {
  const [a, setA] = useState<string>("0");
  const [b, setB] = useState<string>("0");
  const [op, setOp] = useState<string>("+");

  const result = useMemo(() => {
    const na = parseFloat(a || "0");
    const nb = parseFloat(b || "0");
    const f = ops.find((o) => o.k === op)?.fn || ((x: number) => x);
    const r = f(na, nb);
    if (!isFinite(r)) return "";
    return r.toString();
  }, [a, b, op]);

  return (
    <div className="px-4 py-5 pb-24 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Calculadora Científica</h1>
      <Card className="p-4 rounded-2xl border-0 bg-white/90 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Input value={a} onChange={(e) => setA(e.target.value)} className="rounded-lg" />
          <select value={op} onChange={(e) => setOp(e.target.value)} className="rounded-lg border px-3">
            {ops.map((o) => (
              <option key={o.k} value={o.k}>{o.k}</option>
            ))}
          </select>
          <Input value={b} onChange={(e) => setB(e.target.value)} className="rounded-lg" />
        </div>
        <div className="text-sm text-gray-600">Resultado</div>
        <div className="text-2xl font-semibold text-gray-900">{result}</div>
      </Card>
    </div>
  );
};

export default Calculadora;


