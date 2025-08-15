import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

type KeyDef = {
  label: string;
  value: string;
  variant?: "accent" | "danger" | "muted";
  grow?: boolean;
};

const KEYS: KeyDef[] = [
  { label: "C", value: "clear", variant: "danger" },
  { label: "←", value: "back", variant: "muted" },
  { label: "%", value: "%", variant: "muted" },
  { label: "÷", value: "/", variant: "accent" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "×", value: "*", variant: "accent" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "−", value: "-", variant: "accent" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "+", value: "+", variant: "accent" },
  { label: "0", value: "0", grow: true },
  { label: ",", value: "." },
  { label: "=", value: "=", variant: "accent" },
];

const Calculadora = () => {
  const [display, setDisplay] = useState<string>("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(true);

  const inputNumber = (digit: string) => {
    setDisplay((prev) => {
      if (overwrite) {
        setOverwrite(false);
        return digit === "." ? "0." : digit;
      }
      if (digit === "." && prev.includes(".")) return prev;
      if (prev === "0" && digit !== ".") return digit;
      return prev + digit;
    });
  };

  const applyPercent = () => {
    setDisplay((prev) => {
      const n = parseFloat(prev.replace(",", "."));
      if (!isFinite(n)) return prev;
      return (n / 100).toString();
    });
  };

  const chooseOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (acc === null) {
      setAcc(current);
      setOp(nextOp);
      setOverwrite(true);
      return;
    }
    if (op) {
      const res = compute(acc, current, op);
      setAcc(res);
      setDisplay(res.toString());
      setOp(nextOp);
      setOverwrite(true);
    }
  };

  const backspace = () => {
    setDisplay((prev) => {
      if (overwrite) return prev;
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const clearAll = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setOverwrite(true);
  };

  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const equals = () => {
    if (acc === null || !op) return;
    const current = parseFloat(display);
    const res = compute(acc, current, op);
    setDisplay(isFinite(res) ? res.toString() : "Error");
    setAcc(null);
    setOp(null);
    setOverwrite(true);
  };

  const onKey = (v: string) => {
    if (/^[0-9]$/.test(v) || v === ".") return inputNumber(v);
    if (["+", "-", "*", "/"].includes(v)) return chooseOp(v);
    if (v === "clear") return clearAll();
    if (v === "back") return backspace();
    if (v === "%") return applyPercent();
    if (v === "=") return equals();
  };

  // teclado físico
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "=") return onKey("=");
      if (e.key === "Backspace") return onKey("back");
      if (e.key === "Escape") return onKey("clear");
      if (/^[0-9]$/.test(e.key)) return onKey(e.key);
      if (["+", "-", "*", "/", "."].includes(e.key)) return onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Calculadora</h1>
      <Card className="p-4 rounded-2xl border-0 bg-white/90">
        {/* Pantalla */}
        <div className="mb-3 rounded-xl bg-gray-900 text-white p-4 text-right font-mono text-3xl tabular-nums">
          {display}
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-4 gap-2 select-none">
          {KEYS.map((k, idx) => (
            <button
              key={idx}
              onClick={() => onKey(k.value)}
              className={`rounded-xl py-3 text-lg font-semibold transition-colors ${
                k.grow ? "col-span-2" : ""
              } ${
                k.variant === "accent"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : k.variant === "danger"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : k.variant === "muted"
                  ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Calculadora;


