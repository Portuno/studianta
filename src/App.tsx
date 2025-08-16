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
import Agenda from "./pages/Agenda";
import Library from "./pages/Library";
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

  // Mostrar loading mientras se verifica la autenticación
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

  // Si no hay usuario, mostrar solo la página de login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si hay usuario, mostrar las rutas protegidas
  if (!isMobile) {
    return (
      <AppShell>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <div className="mobile-container">
      <Routes>
        <Route path="/" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
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
