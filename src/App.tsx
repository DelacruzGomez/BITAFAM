import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// 🛠️ CORREGIDO: Importamos BrowserRouter explícitamente aquí
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import TerrenoDetalle from "./pages/TerrenoDetalle";
import ListaTerrenos from "./pages/ListaTerrenos"; 
import PublicarTerreno from "./pages/PublicarTerreno"; 
import NotFound from "./pages/NotFound";
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from "./components/ProtectedRoute";
import MisTerrenos from "./pages/MisTerrenos";
import GestionTerrenos from "@/pages/GestionTerrenos";
import EditarTerreno from "@/pages/EditarTerreno";
//import MisFavoritos from "./pages/MisFavoritos";

// 🛠️ CORREGIDO: Quitamos las llaves "{ }" porque tu Navbar exporta por defecto
import Navbar from "@/components/Navbar"; 


// Importación de las tres nuevas páginas de categorización
//import Todos from "@/pages/Todos";
import TerrenosPage from "@/pages/TerrenosPage";
import CasasPage from "@/pages/CasasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* 🛠️ AGREGADO: Añadimos el Navbar aquí arriba para que se renderice en todas las páginas de BITAFAM */}
        <Navbar />

        <Routes>
          <Route path="/" element={<Index />} />
          {/* 🛠️ NOTA: Conservamos ListaTerrenos cambiándole la ruta a /explorar para evitar duplicidad con /terrenos */}
          <Route path="/explorar" element={<ListaTerrenos />} /> 
          <Route path="/terreno/:id" element={<TerrenoDetalle />} />
          <Route path="/MisTerrenos" element={<MisTerrenos />} />
          <Route path="/gestion" element={<GestionTerrenos />} />
          <Route path="/editar/:id" element={<EditarTerreno />} />
          {/*<Route path="/favoritos" element={<MisFavoritos />} />*/}
          
          {/* 🌟 NUEVAS RUTAS DE CATEGORIZACIÓN INDEPENDIENTES */}
          {/*<Route path="/todos" element={<Todos />} />*/}
          <Route path="/terrenos" element={<TerrenosPage />} />
          <Route path="/casas" element={<CasasPage />} />

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
