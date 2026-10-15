import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, MapPin } from "lucide-react";


// Tipado de la propiedad de terreno unificada
interface Terreno {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  ubicacion: string;
  portada: string;
  tipo: string;
  area: number;
}

export default function MisFavoritos() {
  const [favoritos, setFavoritos] = useState<Terreno[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar los favoritos del usuario en sesión
  const fetchFavoritos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Consulta relacional: Trae los favoritos y anida la información de la propiedad
    const { data, error } = await supabase
      .from("land_favorites")
      .select(`
        id,
        land_properties (
          id,
          titulo,
          precio,
          moneda,
          ubicacion,
          portada,
          tipo,
          area
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error al obtener favoritos:", error);
    } else if (data) {
      // Mapeamos y limpiamos el arreglo para quedarnos directamente con el objeto del terreno
      const terrenosMapeados = data
        .map((item: any) => item.land_properties)
        .filter(Boolean); // Filtra en caso de que un terreno haya sido eliminado de la BD
      setFavoritos(terrenosMapeados);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFavoritos();
  }, []);

  // 2. Eliminar un favorito directamente desde el panel
  const handleEliminarFavorito = async (landId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evita que el clic en el botón redirija al detalle del terreno
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("land_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("land_id", landId);

    if (!error) {
      // Actualizamos el estado local de forma reactiva inmedianta
      setFavoritos((prev) => prev.filter((terreno) => terreno.id !== landId));
    } else {
      alert("No se pudo quitar de favoritos: " + error.message);
    }
  };

  // Función formateadora de precios consistente con tu catálogo
  const formatPrecio = (precio: number, moneda: string) => {
    const currencyCode = moneda === "USD" ? "USD" : "PEN";
    const locale = moneda === "USD" ? "en-US" : "es-PE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(precio);
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 font-medium">Cargando tus terrenos guardados...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-2 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al catálogo principal
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Mis Terrenos Favoritos</h1>
            <p className="text-sm text-gray-500 mt-1">Lista de propiedades guardadas para comparar o revisar más tarde.</p>
          </div>
          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
            {favoritos.length} {favoritos.length === 1 ? "Propiedad" : "Propiedades"}
          </span>
        </div>

        {/* Listado de Favoritos Adaptativo */}
        {favoritos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-md mx-auto px-6">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Aún no tienes favoritos</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">Explora nuestro catálogo inmobiliario y presiona el ícono de corazón para guardar tus opciones ideales.</p>
            <Link to="/">
              <Button className="w-full bg-green-600 hover:bg-green-700 font-bold rounded-xl py-5">Explorar Lotes</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritos.map((terreno) => {
              // Lógica idéntica para limpiar el texto de las URLs de mapas
              const textoCompleto = terreno.ubicacion || "";
              const urlRegex = /https?:\/\/[^\s\]]+/g;
              const direccionLimpia = textoCompleto.replace(urlRegex, "").trim();

              return (
                <Link to={`/terreno/${terreno.id}`} key={terreno.id} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full relative">
                    
                    {/* Contenedor Imagen de Portada */}
                    <div className="relative h-48 w-full bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img 
                        src={terreno.portada || "/placeholder-terreno.jpg"} 
                        alt={terreno.titulo} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-gray-700 px-2 py-1 rounded-md shadow-xs">
                        {terreno.tipo || "Terreno"}
                      </span>
                      
                      {/* Botón flotante para eliminar rápido */}
                      <button
                        title="Quitar de favoritos"
                        onClick={(e) => handleEliminarFavorito(terreno.id, e)}
                        className="absolute top-3 right-3 bg-red-50 text-red-600 p-2 rounded-xl shadow-xs border border-red-100 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-base font-bold text-gray-900 tracking-tight leading-snug uppercase mb-1 line-clamp-2 min-h-[44px]">
                        {terreno.titulo}
                      </h3>
                      
                      <p className="text-xs text-gray-500 font-medium truncate mb-4">
                        {direccionLimpia || "Dirección disponible en detalles"}
                      </p>

                      {/* Espacio inferior con Precio y Área */}
                      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Precio</p>
                          <p className="text-base font-black text-green-600">{formatPrecio(terreno.precio, terreno.moneda)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Área Total</p>
                          <p className="text-sm font-bold text-blue-600">{terreno.area} <span className="text-[10px] font-normal text-blue-400">m²</span></p>
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
