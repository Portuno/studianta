import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Users, Zap } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {
    // Redirect if not a success status
    if (status !== "success") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleWhatsAppContact = () => {
    const message = "Hola! Acabo de completar mi pago en Studianta y tengo una consulta.";
    const whatsappUrl = `https://wa.me/614374983?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (status !== "success") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              ¡Tu pago ha sido exitoso!
            </CardTitle>
            <p className="text-lg text-gray-600">
              Tu pago se ha procesado correctamente. ¡Gracias por unirte a Studianta!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">Comunidad Exclusiva</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Desde <strong>Versa Producciones</strong> estamos construyendo una comunidad exclusiva para estudiantes como tú. Con ganas de mejorarse y construir cosas todos los días. Conforme lancemos nuevas funcionalidades, te las haremos llegar directamente.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    ¿Necesitas ayuda urgente?
                  </p>
                  <p className="text-sm text-blue-700 mb-3">
                    Si tienes alguna incidencia o necesitas ayuda urgente, no dudes en contactarme directamente por WhatsApp.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppContact}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Contactar por WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-5 h-5 mr-2" />
                Llevarme a la home
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4">
              <p>Tu suscripción está activa y podrás disfrutar de todas las funcionalidades premium.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess; 