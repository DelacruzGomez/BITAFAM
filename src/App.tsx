
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import TerrenoDetalle from "./pages/TerrenoDetalle";
import ListaTerrenos from "./pages/ListaTerrenos"; // 👈 Ruta pública
import PublicarTerreno from "./pages/PublicarTerreno"; // 👈 Ruta protegida
import NotFound from "./pages/NotFound";
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from "./components/ProtectedRoute";
import MisTerrenos from "./pages/MisTerrenos";
import GestionTerrenos from "@/pages/GestionTerrenos";
import EditarTerreno from "@/pages/EditarTerreno";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/terrenos" element={<ListaTerrenos />} />
          <Route path="/terreno/:id" element={<TerrenoDetalle />} />
          <Route path="/MisTerrenos" element={<MisTerrenos />} />
          <Route path="/gestion" element={<GestionTerrenos />} />
          <Route path="/editar/:id" element={<EditarTerreno />} />


          {/* Rutas protegidas */}
          <Route
            path="/publicar"
            element={
              <ProtectedRoute>
                <PublicarTerreno />
              </ProtectedRoute>
            }
          />

          {/* Autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Error 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
