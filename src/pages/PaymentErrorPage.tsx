import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';

export const PaymentErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const errorCode = searchParams.get('error_code');
  const errorMessage = searchParams.get('error_message') || 'Error desconocido en el pago';

  const getErrorDetails = (code: string | null) => {
    switch (code) {
      case 'card_declined':
        return {
          title: 'Tarjeta Declinada',
          description: 'Tu tarjeta fue rechazada por el banco. Verifica que la información sea correcta.',
          solution: 'Intenta con otra tarjeta o contacta a tu banco.'
        };
      case 'insufficient_funds':
        return {
          title: 'Fondos Insuficientes',
          description: 'No hay suficientes fondos en tu cuenta para completar la transacción.',
          solution: 'Verifica tu saldo o usa otra tarjeta.'
        };
      case 'expired_card':
        return {
          title: 'Tarjeta Expirada',
          description: 'La tarjeta que intentaste usar ha expirado.',
          solution: 'Usa una tarjeta válida o actualiza la información de tu tarjeta.'
        };
      case 'invalid_cvc':
        return {
          title: 'CVC Inválido',
          description: 'El código de seguridad de tu tarjeta es incorrecto.',
          solution: 'Verifica el código CVC de 3 o 4 dígitos en tu tarjeta.'
        };
      default:
        return {
          title: 'Error en el Pago',
          description: errorMessage,
          solution: 'Por favor, intenta nuevamente o contacta a soporte si el problema persiste.'
        };
    }
  };

  const errorDetails = getErrorDetails(errorCode);

  const handleRetryPayment = () => {
    // Redirigir a la página de precios/checkout
    navigate('/pricing'); // Ajusta la ruta según tu app
  };

  const handleContactSupport = () => {
    // Implementar contacto con soporte
    window.open('mailto:soporte@tuapp.com?subject=Error en pago', '_blank');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-800">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Detalles del error */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                Solución sugerida:
              </h3>
              <p className="text-red-700 text-sm">
                {errorDetails.solution}
              </p>
            </div>

            {/* Código de error si existe */}
            {errorCode && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Código de Error:
                </h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {errorCode}
                </code>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRetryPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar Nuevamente
              </Button>
              
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="flex-1"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>
            
            <Button 
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>

            {/* Información adicional */}
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>
                ¿Necesitas ayuda? Nuestro equipo está disponible 24/7
              </p>
              <p>
                Email: <a href="mailto:soporte@tuapp.com" className="text-blue-600 hover:underline">
                  soporte@tuapp.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 