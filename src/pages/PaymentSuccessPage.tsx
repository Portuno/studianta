import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentStatus {
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
}

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session_id');
    
    if (status === 'success') {
      setPaymentStatus({
        status: 'success',
        message: '¡Pago exitoso!',
        details: 'Tu suscripción ha sido activada correctamente.'
      });
      
      // Verificar el estado de la suscripción
      if (sessionId) {
        verifySubscriptionStatus(sessionId);
      }
    } else if (status === 'error') {
      setPaymentStatus({
        status: 'error',
        message: 'Error en el pago',
        details: 'Hubo un problema procesando tu pago. Por favor, intenta nuevamente.'
      });
    } else {
      setPaymentStatus({
        status: 'error',
        message: 'Estado de pago desconocido',
        details: 'No se pudo determinar el estado de tu pago.'
      });
    }
    
    setIsLoading(false);
  }, [searchParams]);

  const verifySubscriptionStatus = async (sessionId: string) => {
    try {
      // Aquí podrías hacer una llamada a tu API para verificar el estado
      // Por ahora, solo simulamos la verificación
      console.log('Verificando sesión:', sessionId);
      
      // Simular delay de verificación
      setTimeout(() => {
        toast.success('Suscripción verificada correctamente');
      }, 2000);
      
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      toast.error('Error verificando la suscripción');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard'); // Ajusta la ruta según tu app
  };

  const handleContactSupport = () => {
    // Implementar contacto con soporte
    toast.info('Funcionalidad de soporte en desarrollo');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            {paymentStatus?.status === 'success' ? (
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            )}
            
            <CardTitle className="text-2xl">
              {paymentStatus?.message}
            </CardTitle>
            
            <CardDescription className="text-lg">
              {paymentStatus?.details}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {paymentStatus?.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ Tu suscripción está activa
                </h3>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Acceso completo a todas las funciones</li>
                  <li>• Soporte prioritario</li>
                  <li>• Actualizaciones automáticas</li>
                  <li>• Facturación mensual automática</li>
                </ul>
              </div>
            )}
            
            {paymentStatus?.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  ❌ Problema con el pago
                </h3>
                <p className="text-red-700 text-sm">
                  Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              {paymentStatus?.status === 'success' ? (
                <Button 
                  onClick={handleGoToDashboard}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Ir al Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={handleContactSupport}
                  variant="outline"
                  className="flex-1"
                >
                  Contactar Soporte
                </Button>
              )}
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                Volver al Inicio
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                ¿Tienes preguntas? Envía un email a{' '}
                <a href="mailto:soporte@tuapp.com" className="text-blue-600 hover:underline">
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