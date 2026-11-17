// src/pages/Index.tsx
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
// 1. Importar los componentes de React de Swiper
import { Swiper, SwiperSlide } from 'swiper/react';

// 2. Importar los módulos necesarios (incluyendo el efecto Coverflow)
import {Navigation } from 'swiper/modules';


// 3. Importar los estilos obligatorios de Swiper
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  Filter,
  ArrowRight,
  HistoryIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import CountUp from "react-countup";

type Terreno = {
  id: number;
  titulo: string;
  precio: number;
  moneda?: string;
  area: number;
  ubicacion: string;
  imagen: string;
  portada: string | null;
  descripcion: string;
  tipo: string;
  status: string;
  user_id: string;
  videos?: string[];
  habitaciones?: number;
  banos?: number;
  pisos?: number;
};

// Convierte texto con URLs en enlaces clickeables SIN duplicar la URL
const TextWithLinks = ({ text }: { text: string }) => {
  const urlRegex = /((https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+))/gi;
  const match = text.match(urlRegex);

  // Si no hay URL, muestra el texto tal cual
  if (!match) {
    return <span>{text}</span>;
  }

  // Tomamos solo la primera URL encontrada
  const url = match[0];

  // Quitamos la URL del texto original para no repetirla visualmente
  const textoSinUrl = text.replace(url, "").trim();

  // Aseguramos que el href tenga http/https
  const href = /^https?:\/\//i.test(url) ? url : "http://" + url;

  return (
    <>
      {/* Texto sin la URL */}
      {textoSinUrl && <span>{textoSinUrl} </span>}

      {/* Enlace clickeable una sola vez */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all inline-block"
      >
        {url}
      </a>
    </>
  );
};

// Cambiado de .png a .webp para una carga instantánea y ultra ligera
const carouselImages = [
  "/quinua2.webp",
  "/banner.webp",
  "/fondo.webp",
  "/fondo2.webp",
  "/fondo3.webp",
];

const ITEMS_PER_PAGE = 6;


const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoUrl = searchParams.get("tipo") || ""; 
  const { user } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // Estado para almacenar la lista de IDs de terrenos favoritos del usuario actual
  const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);
  // Helper para saber si un terreno específico es favorito
  const isFavorito = (landId: string) => idsFavoritos.includes(landId);

  // 2. Alternar favorito (Agregar o Quitar) desde el catálogo
  const handleToggleFavoritoHome = async (landId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evita que dar clic en el corazón abra la página de detalles del terreno
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("Debes iniciar sesión para agregar terrenos a tus favoritos.");
      return;
    }

    if (isFavorito(landId)) {
      // Si ya es favorito, lo eliminamos de Supabase
      const { error } = await supabase
        .from("land_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("land_id", landId);

      if (!error) {
        setIdsFavoritos((prev) => prev.filter((id) => id !== landId));
      }
    } else {
      // Si no es favorito, lo insertamos en Supabase
      const { error } = await supabase
        .from("land_favorites")
        .insert({
          user_id: user.id,
          land_id: landId
        });

      if (!error) {
        setIdsFavoritos((prev) => [...prev, landId]);
      }
    }
  };


    // 1. Lee los parámetros de la URL enviados por el Navbar (terreno / casa)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchTerrenos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error al cargar terrenos:", error.message);
      } else {
        setTerrenos(data || []);
      }
      setLoading(false);
    };
    fetchTerrenos();
  }, []);

  // 🛠️ LÓGICA DE FILTRADO CORREGIDA Y ACUMULATIVA
  const terrenosFiltrados = terrenos.filter((terreno) => {
    // A. Filtro del Navbar Global (URL): Separa Casas de Terrenos
    if (tipoUrl !== "") {
      if (terreno.tipo?.toLowerCase() !== tipoUrl.toLowerCase()) {
        return false;
      }
    }

    // B. 🛠️ CORREGIDO: Filtro Tipo del Desplegable (Apunta a zonificacion y lee siglas rdm)
    if (filtroTipo !== "todos") {
      const valorZonificacion = ((terreno as any).zonificacion || "").toLowerCase().trim();
      const filtroSeleccionado = filtroTipo.toLowerCase().trim();

      if (filtroSeleccionado === "residencial") {
        if (valorZonificacion !== "residencial" && valorZonificacion !== "rdm") {
          return false;
        }
      } else {
        if (valorZonificacion !== filtroSeleccionado) {
          return false;
        }
      }
    }

    // C. Filtro de Precios
    const precioNumerico = Number(terreno.precio || 0);
    if (filtroPrecio !== "todos") {
      if (filtroPrecio === "bajo" && precioNumerico >= 80000) return false;
      if (filtroPrecio === "medio" && (precioNumerico < 80000 || precioNumerico > 120000)) return false;
      if (filtroPrecio === "alto" && precioNumerico <= 120000) return false;
    }

    // D. Filtro de Buscador de Texto
    const textoBusqueda = terminoBusqueda.toLowerCase().trim();
    if (textoBusqueda !== "") {
      const cumpleTexto =
        (terreno.titulo || "").toLowerCase().includes(textoBusqueda) ||
        (terreno.ubicacion || "").toLowerCase().includes(textoBusqueda);
      if (!cumpleTexto) return false;
    }

    return true; // Si pasa todas las condiciones, se incluye
  });

  const totalPages = Math.ceil(terrenosFiltrados.length / ITEMS_PER_PAGE);
  const terrenosPaginados = terrenosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatPrecio = (precio: number, moneda: string = "PEN") => {
    const currencyCode = moneda === "USD" ? "USD" : "PEN";
    const locale = moneda === "USD" ? "en-US" : "es-PE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  // REGLA DE ACCESO PROFESIONAL PARA GESTIÓN DE TERRENOS
  const handleGestionClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. REGLA: Si el usuario NO ha iniciado sesión (No registrado / No logueado)
    if (!user) {
      e.preventDefault(); // Bloquea la navegación automática a /gestion
      
      const deseaLoguearse = window.confirm(
        "⚠️ ¡Acceso Restringido!\n\nPara gestionar tus propiedades debes estar registrado o haber iniciado sesión en la plataforma.\n\n¿Deseas ir al inicio de sesión ahora mismo?"
      );
      
      if (deseaLoguearse) {
        navigate("/login"); // Redirige a tu ruta de login o autenticación
      }
      return;
    }

    // 2. REGLA: Si el usuario es el Administrador de BITAFAM (Acceso sin límites)
    const isAdmin = user.email === "grupobitafam@gmail.com" || (user as any).role === "admin";
    if (isAdmin) {
      return; // Permite el viaje limpio para ver el 100% de los terrenos de la base de datos
    }

    // 3. REGLA: Si es un usuario común, verificamos si tiene terrenos publicados por él mismo
    const terrenosPropios = terrenos.filter((t) => t.user_id === user.id);

    if (terrenosPropios.length === 0) {
      e.preventDefault(); // Bloquea el viaje al panel vacío
      window.alert(
        "ℹ️ Gestión de Cuenta\n\nAún no has publicado ningún terreno con esta cuenta en nuestro catálogo.\n\nDirígete a la opción de Publicar para empezar."
      );
    }
  };

  return (
  <div className="min-h-screen bg-[#28292A] text-slate-100">
      
{/* Hero Section con carrusel de fondo corregido, ultra ligero y fluido */}
<section
  className="relative h-auto min-h-[450px] md:h-[400px] lg:h-[450px] text-white overflow-hidden bg-cover bg-center transition-all duration-1000 ease-in-out flex items-center will-change-[background-image]"
  style={{
    backgroundImage: `url('${carouselImages[currentImageIndex]}')`,
  }}
  aria-label="Sección principal de bienvenida con imagen de fondo en carrusel"
>
  {/* Capa de superposición para mejorar contraste */}
  <div className="absolute inset-0 bg-black/40 z-0"></div>

  {/* Contenedor principal estructurado en dos columnas */}
  <div className="relative container mx-auto px-4 py-8 z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
    
    {/* COLUMNA IZQUIERDA: Textos de Bienvenida */}
    <div className="text-center md:text-left flex flex-col justify-center max-w-xl mx-auto md:mx-0">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight drop-shadow-md">
        Encuentra tu Terreno Ideal en Ayacucho
      </h2>
      <p className="text-sm sm:text-base md:text-lg text-gray-100 mb-6 font-medium leading-relaxed drop-shadow-sm">
        Invierte en el futuro. Descubre terrenos con ubicación privilegiada
        en la histórica ciudad de Ayacucho.
      </p>
      
      {/* Botón de Gestión */}
      <div className="self-center md:self-start">
        <Link to="/gestion" onClick={handleGestionClick} className="inline-block">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold transition-all px-6 py-5 rounded-xl shadow-md active:scale-95"
            aria-label="Gestionar mis terrenos publicados"
          >
            Gestionar Mis Terrenos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>

    {/*Tarjeta Sobre Nosotros */}
    <div className="flex justify-center md:justify-end w-full">
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 text-gray-800 border border-white/20 transition-all transform hover:translate-y-[-2px]">
        <h2 className="text-2xl font-extrabold mb-3 text-green-700 font-sans tracking-tight">
          Sobre Nosotros
        </h2>
        <p className="text-xs sm:text-sm text-justify text-gray-600 leading-relaxed font-medium">
          BITAFAM es tu socio confiable en la búsqueda del terreno perfecto.
          Nos dedicamos a conectar a nuestros clientes con las mejores
          oportunidades de inversión, ofreciendo un servicio transparente,
          profesional y personalizado. Nuestra misión es ayudarte a
          encontrar el lugar ideal para construir tus sueños.
        </p>
      </div>
    </div>

  </div>
</section>

       {/* FILTROS CORREGIDOS CON ALTO CONTRASTE */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            
            {/* Buscador - Corregido texto oculto y placeholder */}
            <div className="flex items-center space-x-2 flex-1 min-w-0 w-full">
              <Input
                placeholder="Buscar por ubicación o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTerminoBusqueda(busqueda);
                    setCurrentPage(1);
                  }
                }}
                className="flex-1 min-w-0 bg-white text-gray-900 placeholder:text-gray-500 font-medium h-11 border-gray-200 focus:ring-green-600 focus:border-green-600"
                aria-label="Buscar por ubicación o nombre"
              />
              <button
                type="button"
                onClick={() => {
                  setTerminoBusqueda(busqueda);
                  setCurrentPage(1);
                }}
                className="text-gray-500 hover:text-green-700 p-2 focus:outline-none transition-colors"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Filtro Tipo - Corregido texto opaco */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center space-x-2 flex-1 md:flex-initial">
                <Filter className="text-gray-500 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <Select
                  value={filtroTipo}
                  onValueChange={(val) => {
                    setFiltroTipo(val);
                    setCurrentPage(1);
                  }}
                  aria-label="Filtrar por tipo"
                >
                  <SelectTrigger className="w-full md:w-44 bg-white text-gray-900 font-semibold h-11 border-gray-200 focus:ring-green-600">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 font-medium">
                    <SelectItem value="todos" className="focus:bg-green-50 focus:text-green-900">Todos los tipos</SelectItem>
                    <SelectItem value="residencial" className="focus:bg-green-50 focus:text-green-900">Residencial</SelectItem>
                    <SelectItem value="comercial" className="focus:bg-green-50 focus:text-green-900">Comercial</SelectItem>
                    <SelectItem value="industrial" className="focus:bg-green-50 focus:text-green-900">Industrial</SelectItem>
                    <SelectItem value="campestre" className="focus:bg-green-50 focus:text-green-900">Campestre</SelectItem>
                    <SelectItem value="rural" className="focus:bg-green-50 focus:text-green-900">Rural</SelectItem>
                    <SelectItem value="urbano" className="focus:bg-green-50 focus:text-green-900">Urbano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro Precio - Corregido texto opaco */}
            <div className="w-full md:w-auto">
              <Select
                value={filtroPrecio}
                onValueChange={(val) => {
                  setFiltroPrecio(val);
                  setCurrentPage(1);
                }}
                aria-label="Filtrar por precio"
              >
                <SelectTrigger className="w-full md:w-44 bg-white text-gray-900 font-semibold h-11 border-gray-200 focus:ring-green-600">
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 font-medium">
                  <SelectItem value="todos" className="focus:bg-green-50 focus:text-green-900">Todos los precios</SelectItem>
                  <SelectItem value="bajo" className="focus:bg-green-50 focus:text-green-900">Hasta S/. 80,000</SelectItem>
                  <SelectItem value="medio" className="focus:bg-green-50 focus:text-green-900">S/. 80,000 - S/. 120,000</SelectItem>
                  <SelectItem value="alto" className="focus:bg-green-50 focus:text-green-900">Más de S/. 120,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>


       {/* RESULTADOS */}
{loading ? (
  <div className="text-center py-12" role="status" aria-live="polite">
    <p className="text-gray-500 text-lg font-sans">Cargando terrenos...</p>
  </div>
) : (
  <>
    <p className="text-gray-600 mb-6 font-sans text-sm px-4">
      Se encontraron {terrenosFiltrados.length} terrenos
    </p>

    {/* Contenedor en rejilla (Grid) vertical sin slider */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
      {terrenosFiltrados.map((terreno) => (
        <div 
          key={terreno.id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col font-sans transition-all duration-300 hover:shadow-md h-full justify-between w-full max-w-[340px] mx-auto"
        >
          {/* Carrusel Local de Multimedia */}
          <TarjetaMediaSliderHome terreno={terreno} />

          {/* Contenido de la Tarjeta */}
          <div className="p-5 flex flex-col flex-grow relative">

            {/* ✅ CÓDIGO CORREGIDO PARA TYPESCRIPT: Casteado a 'any' para evitar el error de tipado */}
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block pr-8">
              {(() => {
                const mapeoClasificacion: Record<string, string> = {
                  "urbano": "URBANO",
                  "rural": "RURAL",
                  "campestre": "CAMPESTRE",
                  "residencial": "RESIDENCIAL",
                  "rdm": "RESIDENCIAL", 
                  "comercial": "COMERCIAL",
                  "industrial": "INDUSTRIAL",
                  "np": "URBANO" 
                };

                // 🛠️ Forzamos a TypeScript a leer 'zonificacion' usando (terreno as any)
                const valorBD = ((terreno as any).zonificacion || "").toLowerCase().trim();
                const clasificacionLimpia = mapeoClasificacion[valorBD] || "URBANO"; 

                return `${terreno.tipo || "TERRENO"} • ${clasificacionLimpia}`;
              })()}
            </span>



            <h4 className="text-lg font-bold text-gray-900 tracking-tight leading-snug mb-1 uppercase line-clamp-1 pr-8">
              {terreno.titulo}
            </h4>

            {/* Lógica de ubicación unificada e inteligente */}
            {(() => {
              const textoCompleto = terreno.ubicacion || "";
              const urlRegex = /https?:\/\/[^\s\]]+/g;
              const links = textoCompleto.match(urlRegex);
              const direccionLimpia = textoCompleto.replace(urlRegex, "").trim();

              return (
                <div className="flex flex-col gap-2 mb-4">
                  {/* Dirección física limpia (Sin URLs visibles) */}
                  <p className="text-sm text-gray-600 font-medium truncate">
                    {direccionLimpia || "Dirección disponible en el mapa"}
                  </p>

                  {/* Botón interactivo de Google Maps si el enlace existe */}
                  {links && links.length > 0 ? (
                    <a 
                      href={links[0]} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs transition-all w-full sm:w-auto justify-center self-start"
                    >
                      <svg 
                        className="w-3.5 h-3.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        viewBox="0 0 24 24" 
                        xmlns="http://w3.org"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>Ver Ubicación en Google Maps</span>
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Mapa no adjuntado</span>
                  )}
                </div>
              );
            })()}

            {/* Características Técnicas */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 text-2xl border-b border-gray-900 pb-4 mb-4">
              <div className="flex items-center gap-2" title="Área Total">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://w3.org">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M15 4v16M4 9h16M4 15h16" />
                </svg>
                <span className="font-semibold text-gray-800">
                  {terreno.area} <span className="text-gray-500 font-normal text-base">m²</span>
                </span>
              </div>

              {terreno.habitaciones && terreno.habitaciones > 0 ? (
                <div className="flex items-center gap-2" title="Habitaciones">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://w3.org">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M5.25 6h13.5A1.5 1.5 0 0120.25 7.5v4.5H3.75v-4.5A1.5 1.5 0 015.25 6zM3.75 15.75v2.25m16.5-2.25v2.25" />
                  </svg>
                  <span className="font-semibold text-gray-800">
                    {terreno.habitaciones} <span className="text-gray-500 font-normal text-xs">hab</span>
                  </span>
                </div>
              ) : null}

              {terreno.banos && terreno.banos > 0 ? (
                <div className="flex items-center gap-2" title="Baños">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://w3.org">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 7.5h2.25M3 19.5h18M18 19.5v-9A2.25 2.25 0 0015.75 8.25H8.25A2.25 2.25 0 006 10.5v9M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3M10.5 12h3" />
                  </svg>
                  <span className="font-semibold text-gray-800">
                    {terreno.banos} <span className="text-gray-500 font-normal text-xs">baño</span>
                  </span>
                </div>
              ) : null}
            </div>

            <p className="text-gray-500 text-xs leading-relaxed mb-5 line-clamp-2">
              {terreno.descripcion}
            </p>

            <div className="mb-5 mt-auto">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatPrecio(terreno.precio, terreno.moneda || "PEN")}
              </span>
            </div>

            <Link to={`/terreno/${terreno.id}`} className="w-full block">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-green-900 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
              >
                Ver Detalles
              </button>
            </Link>

            {/* Controles Administrativos */}
            {user && user.id === terreno.user_id && (
              <div className="flex flex-col gap-2 mt-4 border-t border-gray-100 pt-4 w-full">
                <Button 
  variant="outline" 
  size="sm" 
  className="text-xs font-medium w-full text-black" 
  onClick={async () => { 
    const nuevoEstado = terreno.status === "vendido" ? "disponible" : "vendido"; 
    const { error } = await supabase 
      .from("land_properties") 
      .update({ status: nuevoEstado }) 
      .eq("id", terreno.id); 

    if (!error) { 
      setTerrenos((prev) => 
        prev.map((t) => (t.id === terreno.id ? { ...t, status: nuevoEstado } : t)) 
      ); 
    } else { 
      alert("Error al actualizar estado"); 
    } 
  }} 
> 
  {terreno.status === "vendido" ? "Marcar como disponible" : "Marcar como vendido"} 
</Button>

                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    size="sm"
                    className="text-xs font-medium"
                    onClick={() => navigate(`/editar/${terreno.id}`, { state: { terreno } })}
                  >
                    Editar
                  </Button>



                             <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs font-medium"
                  onClick={async () => {
                    const confirmar = window.confirm("¿Seguro que deseas eliminar este terreno?");
                    if (!confirmar) return;
                    
                    const { error } = await supabase
                      .from("land_properties")
                      .delete()
                      .eq("id", terreno.id);

                    if (!error) {
                      setTerrenos((prev) => prev.filter((t) => t.id !== terreno.id));
                    } else {
                      alert("Error al eliminar");
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>

  {/* 5. Mensaje de control si no hay resultados */}
  {terrenosFiltrados.length === 0 && (
    <div className="text-center py-12" role="status" aria-live="polite">
      <p className="text-gray-500 text-lg font-sans">
        No se encontraron {tipoUrl === 'casa' ? 'casas' : tipoUrl === 'terreno' ? 'terrenos' : 'propiedades'} que coincidan con la selección.
      </p>
    </div>
  )}
</>
)}
</section>




      {/* SECCIÓN: ¿POR QUÉ ELEGIRNOS? */}
      <section className="bg-gray-100 py-14 w-full">
        <h3 className="text-3xl font-bold text-green-800 mb-12 text-center w-full px-4 sm:px-6 lg:px-0">
          ¿Por qué Elegirnos?
        </h3>

        <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-10 lg:px-24 gap-10">
          {/* Tarjetas izquierda */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-8 w-full md:w-[63vw] lg:w-[68vw]">
            {[
              {
                img: "https://img.freepik.com/foto-gratis/parcelas-tierra-paisaje-natural-pin-ubicacion_23-2149937913.jpg",
                title: "TERRENOS / LOTES",
                desc: "Amplias parcelas de terreno, ideales para proyectos residenciales, comerciales o agrícolas. Oportunidad para inversionistas que buscan construir y crecer.",
              },
              {
                img: "https://alqzzwzgzvvugtdjlqym.supabase.co/storage/v1/object/public/land-images/terrenos/1755105091458_sala.png",
                title: "DEPARTAMENTOS",
                desc: "Modernos departamentos diseñados para ofrecer comodidad y funcionalidad, con acabados de calidad y ubicaciones cercanas a servicios esenciales. Perfectos para vivir o invertir.",
              },
              {
                img: "https://www.argentinaproduct.com/ckfinder/userfiles/files/blog/alq06.jpg",
                title: "ALQUILERES",
                desc: "Variedad de opciones de alquiler que se adaptan a diferentes necesidades, desde viviendas hasta locales comerciales, con excelentes condiciones y ubicaciones accesibles.",
              },
            ].map(({ img, title, desc }, i) => (
              <div
                key={i}
                className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl group w-full sm:w-[45%] md:w-[30%] min-w-[230px] max-w-[400px]"
              >
                <img
                  src={img}
                  alt={title}
                  className="w-full h-44 object-cover object-center block"
                />

                {/* Franja de título más compacta, sin botón */}
                <div className="bg-green-900 text-white text-center font-bold text-base md:text-lg px-3 py-3 w-full">
                  {title}
                </div>

                {/* Descripción que aparece al hacer hover */}
                <div className="max-h-0 overflow-hidden bg-green-800 text-green-200 text-sm px-4 pt-0 pb-0 text-center transition-all duration-500 group-hover:max-h-32 group-hover:pt-3 group-hover:pb-4">
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Conteos derecha */}
          <div className="grid grid-cols-1 gap-12 text-center w-full max-w-md md:w-[30vw] lg:w-[27vw] px-4 md:px-0">
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={15} duration={5} prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Años de Experiencia
              </p>
            </div>
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={1400} duration={5} separator="," prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Personas beneficiadas
              </p>
            </div>
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={50} duration={5} separator="," prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Inversionistas capacitados
              </p>
            </div>
          </div>
        </div>
      </section>


         {/* Sección Sobre Ayacucho */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin
                  className="text-green-600 h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-xl font-semibold mb-2">Ubicación Estratégica</h4>
              <p className="text-gray-600">Centro geográfico del Perú.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight
                  className="text-amber-600 h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-xl font-semibold mb-2">Crecimiento Económico</h4>
              <p className="text-gray-600">Nuevas oportunidades de inversión.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HistoryIcon
                  className="text-blue-600 h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-xl font-semibold mb-2">Historia y Cultura</h4>
              <p className="text-gray-600">Patrimonio que impulsa el turismo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/bitafam.webp"
                  alt="Logo BITAFAM"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400">
                Tu socio confiable en la búsqueda del terreno perfecto en Ayacucho.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400">
                <p>📞 998 026 135</p>
                <p>✉️ grupobitafam@gmail.com</p>
                <p>📍 Alfonso Ugarte 101, Ayacucho</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Horarios</h4>
              <div className="space-y-2 text-gray-400">
                <p>Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábados: 9:00 AM - 2:00 PM</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; BITAFAM. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
interface SliderProps {
  terreno: any;
}

// CORRECCIÓN: Se eliminó la palabra 'export' para evitar el error de modificadores
const TarjetaMediaSliderHome = ({ terreno }: SliderProps) => {
  const t = terreno as any;
  const todasLasImagenes = t.imagenes || [];
  const todosLosVideos = t.videos || [];
  
  // 1. Unimos todo lo que venga en los arreglos de la base de datos
  let baseMedia = [...todasLasImagenes, ...todosLosVideos].filter(Boolean);

  // 2. Si venía vacío, le inyectamos la portada o la imagen única de respaldo
  if (baseMedia.length === 0) {
    if (t.portada) baseMedia.push(t.portada);
    else if (t.imagen) baseMedia.push(t.imagen);
  } else {
    // 3. ¡SOLUCIÓN DE RAÍZ!: Si tiene portada, nos aseguramos de ponerla al inicio,
    // pero eliminando cualquier duplicado idéntico dentro del arreglo usando Array.from(new Set())
    if (t.portada) {
      baseMedia = [t.portada, ...baseMedia];
    }
  }

  // Eliminamos cualquier URL repetida para que al dar siguiente avance a una foto NUEVA
  const listaMedia = Array.from(new Set(baseMedia));

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setCurrentIndex((prev) => (prev + 1) % listaMedia.length);
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setCurrentIndex((prev) => (prev - 1 + listaMedia.length) % listaMedia.length);
  };

  const currentUrl = listaMedia[currentIndex] || "";
  const esVideo = currentUrl.toLowerCase().endsWith(".mp4");

  return (
    <div className="relative aspect-[4/3] bg-gray-50 w-full overflow-hidden group/media">
      {esVideo ? (
        <video src={currentUrl} controls className="w-full h-full object-cover" />
      ) : (
        <img src={currentUrl} alt={terreno.titulo} className="w-full h-full object-cover" />
      )}
      
      {listaMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevMedia}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover/media:opacity-100 z-20 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNextMedia}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover/media:opacity-100 z-20 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {listaMedia.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <span className="absolute top-3 right-3 bg-green-600 text-white font-semibold text-xs tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm z-10">
        {terreno.tipo}
      </span>
      
      {terreno.status === "vendido" && (
        <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs tracking-wider px-2.5 py-1 rounded-md shadow-sm z-10">
          VENDIDO
        </div>
      )}
    </div>
  );
};
export default Index;
