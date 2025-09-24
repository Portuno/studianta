import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MobileNavigation } from "@/components/MobileNavigation";
import AppShell from "@/components/AppShell";
import { useIsMobile } from "@/hooks/use-mobile";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Library from "./pages/Library";
import Notas from "./pages/Notas";
import Chat from "./pages/Chat";
import Herramientas from "./pages/Herramientas";
import Resumenes from "./pages/herramientas/Resumenes";
import PDF from "./pages/herramientas/PDF";
import Diario from "./pages/herramientas/Diario";
import Calculadora from "./pages/herramientas/Calculadora";
import Examenes from "./pages/herramientas/Examenes";
import Flashcards from "./pages/herramientas/Flashcards";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";
import PaymentSuccess from "./pages/PaymentSuccess";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/OnboardingModal";

const queryClient = new QueryClient();

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const AppContent = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingOpen(false);
        setProfileChecked(true);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('id, is_onboarded')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error leyendo perfil de usuario:', error);
        setOnboardingOpen(false);
        setProfileChecked(true);
        return;
      }

      setOnboardingOpen(!data?.is_onboarded);
      setProfileChecked(true);
    };

    checkOnboarding();
  }, [user]);

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({ is_onboarded: true })
      .eq('id', user.id);

    if (error) {
      console.error('No se pudo completar el onboarding:', error);
      return;
    }
    setOnboardingOpen(false);
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading || !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar solo la página de login
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Si hay usuario, mostrar las rutas protegidas y el modal de onboarding
  if (!isMobile) {
    return (
      <AppShell>
        <OnboardingModal open={onboardingOpen} onComplete={handleCompleteOnboarding} />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/herramientas" element={<ProtectedRoute><Herramientas /></ProtectedRoute>} />
          <Route path="/herramientas/resumenes" element={<ProtectedRoute><Resumenes /></ProtectedRoute>} />
          <Route path="/herramientas/pdf" element={<ProtectedRoute><PDF /></ProtectedRoute>} />
          <Route path="/herramientas/diario" element={<ProtectedRoute><Diario /></ProtectedRoute>} />
          <Route path="/herramientas/calculadora" element={<ProtectedRoute><Calculadora /></ProtectedRoute>} />
          <Route path="/herramientas/examenes" element={<ProtectedRoute><Examenes /></ProtectedRoute>} />
          <Route path="/herramientas/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <div className="mobile-container">
      <OnboardingModal open={onboardingOpen} onComplete={handleCompleteOnboarding} />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/notas" element={<ProtectedRoute><Notas /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/herramientas" element={<ProtectedRoute><Herramientas /></ProtectedRoute>} />
        <Route path="/herramientas/resumenes" element={<ProtectedRoute><Resumenes /></ProtectedRoute>} />
        <Route path="/herramientas/pdf" element={<ProtectedRoute><PDF /></ProtectedRoute>} />
        <Route path="/herramientas/diario" element={<ProtectedRoute><Diario /></ProtectedRoute>} />
        <Route path="/herramientas/calculadora" element={<ProtectedRoute><Calculadora /></ProtectedRoute>} />
        <Route path="/herramientas/examenes" element={<ProtectedRoute><Examenes /></ProtectedRoute>} />
        <Route path="/herramientas/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MobileNavigation />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
