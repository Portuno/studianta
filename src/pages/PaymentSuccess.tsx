import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const status = searchParams.get("status");

	useEffect(() => {
		if (status !== "success") {
			navigate("/", { replace: true });
		}
	}, [status, navigate]);

	const handleGoToDashboard = () => {
		navigate("/dashboard", { replace: true });
	};

	const handleGoHome = () => {
		navigate("/", { replace: true });
	};

	const handleWhatsAppContact = () => {
		const message = "Hola! Acabo de completar mi pago y tengo una consulta.";
		const whatsappUrl = `https://wa.me/34614374983?text=${encodeURIComponent(message)}`;
		window.open(whatsappUrl, "_blank", "noopener,noreferrer");
	};

	if (status !== "success") return null;

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full">
				<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
					<CardHeader className="text-center pb-6">
						<div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
							<CheckCircle className="w-12 h-12 text-green-600" aria-hidden="true" />
						</div>
						<CardTitle className="text-3xl font-bold text-gray-900 mb-2">
							¡Tu pago fue un éxito!
						</CardTitle>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="text-gray-700 leading-relaxed space-y-4">
							<p>
								<strong>Un proyecto de Versa Producciones</strong>
							</p>
							<p>
								Este producto es una creación de Versa Producciones (
								<a
									href="https://www.versaproducciones.com"
									target="_blank"
									rel="noreferrer noopener"
									className="text-blue-600 underline hover:text-blue-700"
								>
									www.versaproducciones.com
								</a>
								). Estamos dedicados a construir una comunidad de estudiantes y ya estamos trabajando en nuevas funciones que te encantarán. ¡Te avisaremos en cuanto estén listas!
							</p>
							<p>
								Si tienes cualquier duda, o si te encuentras con algún problema técnico, no lo pienses y escríbeme directamente a mi número personal por WhatsApp: <span className="font-medium">+34614374983</span>.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
							<Button
								onClick={handleGoToDashboard}
								size="lg"
								className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6"
								aria-label="Ir al Dashboard"
							>
								Ir al Dashboard
							</Button>
							<Button
								variant="outline"
								onClick={handleGoHome}
								size="lg"
								className="w-full sm:w-auto text-gray-700 border-gray-300 hover:bg-gray-100"
								aria-label="Volver al Inicio"
							>
								Volver al Inicio
							</Button>
						</div>

						<div className="text-center">
							<Button
								variant="ghost"
								onClick={handleWhatsAppContact}
								size="sm"
								className="text-blue-700 hover:bg-blue-50"
								aria-label="Contactar por WhatsApp"
							>
								Contactar por WhatsApp
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default PaymentSuccess; 