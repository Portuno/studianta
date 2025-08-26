import { PDFConverterComponent } from "@/components/PDFConverter";

const PDF = () => {
  return (
    <div className="px-4 py-5 pb-24 md:pb-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Convertir a PDF</h1>
      <PDFConverterComponent />
    </div>
  );
};

export default PDF;


