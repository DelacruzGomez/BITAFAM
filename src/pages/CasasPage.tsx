import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Filter, ArrowRight, HistoryIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const TextWithLinks = ({ text }: { text: string }) => {
  const urlRegex = /((https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+))/gi;
  const match = text.match(urlRegex);

  if (!match) return <span>{text}</span>;

  const url = match[0];
  const textoSinUrl = text.replace(url, "").trim();
  const href = /^https?:\/\//i.test(url) ? url : "http://" + url;

  return (
    <>
      {textoSinUrl && <span>{textoSinUrl} </span>}
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all inline-block">
        {url}
      </a>
    </>
  );
};

const ITEMS_PER_PAGE = 6;
const CasasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);

  useEffect(() => {
    const cargarFavoritosHome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("land_favorites")
        .select("land_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setIdsFavoritos(data.map((fav) => fav.land_id));
      }
    };
    cargarFavoritosHome();
  }, []);

  const isFavorito = (landId: string) => idsFavoritos.includes(landId);
  const handleToggleFavoritoHome = async (landId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("Debes iniciar sesión para agregar propiedades a tus favoritos.");
      return;
    }

    if (isFavorito(landId)) {
      const { error } = await supabase
        .from("land_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("land_id", landId);

      if (!error) {
        setIdsFavoritos((prev) => prev.filter((id) => id !== landId));
      }
    } else {
      const { error } = await supabase
        .from("land_favorites")
        .insert({ user_id: user.id, land_id: landId });

      if (!error) {
        setIdsFavoritos((prev) => [...prev, landId]);
      }
    }
  };

  useEffect(() => {
    const fetchTerrenos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar propiedades:", error.message);
      } else {
        setTerrenos(data || []);
      }
      setLoading(false);
    };
    fetchTerrenos();
  }, []);
  // 🛠️ LÓGICA DE FILTRADO CORREGIDA Y ACUMULATIVA EXCLUSIVA PARA CASAS
  const terrenosFiltrados = terrenos.filter((terreno) => {
    
    // REGLA CLAVE: Forzar a que solo entren propiedades de tipo Casa
    if ((terreno.tipo || "").toLowerCase().trim() !== "casa") {
      return false;
    }

    // B. Filtro Tipo de Zonificación
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

    // D. Filtro del Buscador de Texto
    const textoBusqueda = terminoBusqueda.toLowerCase().trim();
    if (textoBusqueda !== "") {
      const cumpleTexto =
        (terreno.titulo || "").toLowerCase().includes(textoBusqueda) ||
        (terreno.ubicacion || "").toLowerCase().includes(textoBusqueda);
      if (!cumpleTexto) return false;
    }

    return true;
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
  return (
  <div className="min-h-screen bg-[#28292A] text-slate-100">


      <section className="py-8 max-w-7xl mx-auto px-4 flex flex-col items-center text-center"> 
  <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans mb-2"> 
          Catálogo de Casas Disponibles
        </h1>
        <p className="text-gray-200 font-sans text-sm mb-8">
          Explora residencias, casas de campo y opciones listas para mudarte con la mejor distribución.
        </p>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-gray-500 text-lg font-sans">Cargando propiedades...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 font-sans text-sm px-4">
              Se encontraron {terrenosFiltrados.length} casas
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
              {terrenosFiltrados.map((terreno) => (
                <div 
                  key={terreno.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col font-sans transition-all duration-300 hover:shadow-md h-full justify-between w-full max-w-[340px] mx-auto"
                >
                  <TarjetaMediaSliderHome terreno={terreno} />

                  <div className="p-5 flex flex-col flex-grow relative">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block pr-8">
                      {(() => {
                        const mapeoClasificacion: Record<string, string> = {
                          "urbano": "URBANO", "rural": "RURAL", "campestre": "CAMPESTRE",
                          "residencial": "RESIDENCIAL", "rdm": "RESIDENCIAL", 
                          "comercial": "COMERCIAL", "industrial": "INDUSTRIAL", "np": "URBANO" 
                        };
                        const valorBD = ((terreno as any).zonificacion || "").toLowerCase().trim();
                        const clasificacionLimpia = mapeoClasificacion[valorBD] || "URBANO"; 
                        return `${terreno.tipo || "CASA"} • ${clasificacionLimpia}`;
                      })()}
                    </span>

                    <h4 className="text-lg font-bold text-gray-900 tracking-tight leading-snug mb-1 uppercase line-clamp-1 pr-8">
                      {terreno.titulo}
                    </h4>

                    {(() => {
                      const textoCompleto = terreno.ubicacion || "";
                      const urlRegex = /https?:\/\/[^\s\]]+/g;
                      const links = textoCompleto.match(urlRegex);
                      const direccionLimpia = textoCompleto.replace(urlRegex, "").trim();

                      return (
                        <div className="flex flex-col gap-2 mb-4">
                          <p className="text-sm text-gray-600 font-medium truncate">
                            {direccionLimpia || "Dirección disponible en el mapa"}
                          </p>

                          {links && links.length > 0 ? (
                            <a href={links[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all w-full sm:w-auto justify-center self-start">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://w3.org">
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 text-2xl border-b border-gray-900 pb-4 mb-4">
                      <div className="flex items-center gap-2" title="Área Total">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://w3.org">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M15 4v16M4 9h16M4 15h16" />
                        </svg>
                        <span className="font-semibold text-gray-800">
                          {terreno.area} <span className="text-gray-500 font-normal text-xs">m²</span>
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
                      <button type="button" className="w-full py-2.5 px-4 bg-green-900 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]">
                        Ver Detalles
                      </button>
                    </Link>
                    {user && user.id === terreno.user_id && (
                      <div className="flex flex-col gap-2 mt-4 border-t border-gray-100 pt-4 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium w-full text-black"
                          onClick={async () => {
                            const nuevoEstado = terreno.status === "vendido" ? "disponible" : "vendido";
                            const { error } = await supabase.from("land_properties").update({ status: nuevoEstado }).eq("id", terreno.id);
                            if (!error) {
                              setTerrenos((prev) => prev.map((t) => (t.id === terreno.id ? { ...t, status: nuevoEstado } : t)));
                            } else {
                              alert("Error al actualizar estado");
                            }
                          }}
                        >
                          {terreno.status === "vendido" ? "Marcar como disponible" : "Marcar como vendido"}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <Button size="sm" className="text-xs font-medium" onClick={() => navigate(`/editar/${terreno.id}`, { state: { terreno } })}>
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs font-medium"
                            onClick={async () => {
                              const confirmar = window.confirm("¿Seguro que deseas eliminar esta casa?");
                              if (!confirmar) return;
                              const { error } = await supabase.from("land_properties").delete().eq("id", terreno.id);
                              if (!error) setTerrenos((prev) => prev.filter((t) => t.id !== terreno.id));
                              else alert("Error al eliminar");
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

            {terrenosFiltrados.length === 0 && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <p className="text-gray-500 text-lg font-sans">
                  No se encontraron casas disponibles que coincidan con los filtros seleccionados.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
interface SliderProps {
  terreno: any;
}

const TarjetaMediaSliderHome = ({ terreno }: SliderProps) => {
  const t = terreno as any;
  const todasLasImagenes = t.imagenes || [];
  const todosLosVideos = t.videos || [];
  
  let baseMedia = [...todasLasImagenes, ...todosLosVideos].filter(Boolean);

  if (baseMedia.length === 0) {
    if (t.portada) baseMedia.push(t.portada);
    else if (t.imagen) baseMedia.push(t.imagen);
  } else {
    if (t.portada) baseMedia = [t.portada, ...baseMedia];
  }

  const listaMedia = Array.from(new Set(baseMedia));
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % listaMedia.length);
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
          <button type="button" onClick={handlePrevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity z-10">
            &#10094;
          </button>
          <button type="button" onClick={handleNextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity z-10">
            &#10095;
          </button>
        </>
      )}
    </div>
  );
};

export default CasasPage;
