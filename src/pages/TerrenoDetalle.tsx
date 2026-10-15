import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Share2,
  Heart,
  X,
  Map, // Añadido para un look de mapa profesional
} from "lucide-react";
import { useState, useEffect } from "react";
import ContactForm from "@/components/ContactForm";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@supabase/auth-helpers-react";

// Componente optimizado para convertir URLs de mapas en botones clicables limpios
const LocationLink = ({ url }: { url: string }) => {
  if (!url) return null;
  
  // Limpiamos el string si viene con espacios
  const cleanUrl = url.trim();
  const href = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 font-semibold text-xs rounded-lg transition-all duration-200 shadow-sm group mt-1"
    >
      <Map className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
      <span>Ver Ubicación en Google Maps</span>
    </a>
  );
};

const TerrenoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const currentUser = session?.user;
  
  // Tipado flexible para soportar de manera segura las nuevas columnas dinámicas
  const [terreno, setTerreno] = useState<any>(null);
  const [actualMediaIndex, setActualMediaIndex] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerreno = async () => {
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        console.error("Error al obtener terreno:", error);
      } else {
        setTerreno(data);
      }
    };
    fetchTerreno();
  }, [id]);
// Sincronización del estado "Me gusta" con la base de datos de Supabase
  useEffect(() => {
    const verificarFavorito = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) {
        setGuardado(false);
        return;
      }

      const { data, error } = await supabase
        .from("land_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("land_id", id)
        .maybeSingle();

      if (!error && data) {
        setGuardado(true);
      } else {
        setGuardado(false);
      }
    };

    verificarFavorito();
  }, [id]);

  useEffect(() => {
    setGuardado(false);
  }, [id]);

  if (!terreno) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full mx-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h1>
          <p className="text-gray-500 text-sm mb-6">El enlace es incorrecto o la propiedad ya no está disponible.</p>
          <Link to="/">
            <Button className="w-full shadow-sm">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const serviciosArray = Array.isArray(terreno.servicios)
    ? terreno.servicios
    : terreno.servicios?.split(",") || [];

  const galeriaMedia = [...(terreno.imagenes || []), ...(terreno.videos || [])].filter(Boolean);

  const isVideo = (url: string) => url.toLowerCase().endsWith(".mp4");

  const formatPrecio = (precio: number, moneda: string) => {
    const currencyCode = moneda === "USD" ? "USD" : "PEN";
    const locale = moneda === "USD" ? "en-US" : "es-PE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  // bypass de seguridad para TypeScript en caso de que la interfaz no esté actualizada aún
  const t = terreno as any;

  const detalles = {
    dimensiones: terreno.dimensiones || "No especificado",
    topografia: terreno.topografia || "No especificado",
    acceso: terreno.acceso || "No especificado",
    zonificacion: terreno.zonificacion || "No especificado",
    servicios: serviciosArray,
    documentos: terreno.documentacion || "No especificado",
    // Agregamos las nuevas propiedades a la estructura de control
    habitaciones: Number(t.habitaciones) || 0,
    banos: Number(t.banos) || 0,
    pisos: Number(t.pisos) || 0,
  };

  const handleMediaClick = (index: number) => {
    setActualMediaIndex(index);
    setModalMediaUrl(galeriaMedia[index]);
  };

    const toggleGuardar = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      alert("Debes iniciar sesión para guardar terrenos en tus favoritos.");
      return;
    }

    if (guardado) {
      // Si ya estaba en favoritos, lo eliminamos de forma permanente
      const { error } = await supabase
        .from("land_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("land_id", id);

      if (!error) {
        setGuardado(false);
      } else {
        console.error("Error al quitar favorito:", error.message);
      }
    } else {
      // Si no estaba en favoritos, lo añadimos vinculándolo con el ID del usuario
      const { error } = await supabase
        .from("land_favorites")
        .insert({
          user_id: user.id,
          land_id: id
        });

      if (!error) {
        setGuardado(true);
      } else {
        console.error("Error al agregar favorito:", error.message);
      }
    }
  };


  // Corregido con concatenación simple sin caracteres de escape (\)
  const gmailLink = "https://google.com" + 
    encodeURIComponent("Consulta sobre terreno: " + (terreno?.titulo || "")) + 
    "&body=" + encodeURIComponent("Hola,\n\nEstoy interesado en obtener más información sobre el terreno \"" + (terreno?.titulo || "") + "\". Por favor, contáctenme.\n\nGracias.");

  const closeModal = () => setModalMediaUrl(null);

  // 1. CONSTRUIMOS EL TEXTO DEL MENSAJE LIMPIO
  const mensajeInmobiliario = "Hola, BITAFAM.\nEstoy muy interesado en el terreno \"" + (terreno?.titulo || "") + "\" ubicado en la zona de " + (terreno?.ubicacion || "la propiedad") + " que tiene en venta. Me gustaría recibir más información detallada, como el precio final, las medidas exactas y si cuenta con todos los papeles en regla.\nQuedo atento a sus comentarios para coordinar una llamada o una visita.\nSaludos cordiales.";
  
  const numeroWhatsApp = terreno?.whatsapp ?? "51998026135";
  
  // SOLUCIÓN DEFINITIVA: Unimos los textos con un '+' normal. Adiós llaves rotas.
  
  const whatsappLinkFinal = "https://wa.me/" + numeroWhatsApp + "?text=" + encodeURIComponent(mensajeInmobiliario);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-green-600 hover:text-green-700">
            <ArrowLeft className="h-5 w-5" />
            <span>Volver al catálogo</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const shareData = {
                  title: terreno.titulo || "Terreno Ideal en Ayacucho",
                  text: `Mira este terreno: ${terreno.titulo || "Gran oportunidad de inversión en Ayacucho"}.`,
                  url: window.location.href,
                };

                // Verifica si el navegador soporta el menú de compartir nativo
                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                  } catch (err) {
                    console.log("Compartir cancelado o con errores", err);
                  }
                } else {
                  // Respaldo en caso de que el navegador de escritorio no soporte Web Share API
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    alert("Tu navegador no soporta el menú de compartir. ¡El link ha sido copiado al portapapeles!");
                  });
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
            <Button
              variant={guardado ? "default" : "outline"}
              size="sm"
              onClick={toggleGuardar}
              title={guardado ? "Quitar de favoritos" : "Guardar como favorito"}
            >
              <Heart className={`h-4 w-4 mr-2 ${guardado ? "text-red-600" : ""}`} />
              {guardado ? "Guardado" : "Guardar"}
            </Button>
          </div>
        </div>
      </header>

      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
                        {/* VISTA DE GALERÍA INTERACTIVA DE NIVEL PROFESIONAL */}
                        
            <Card className="mb-6 shadow-sm border-gray-100 overflow-hidden">
              <CardContent className="p-0">
                {/* Contenedor principal del visor multimedia */}
                <div className="relative group/gallery bg-black h-96 flex items-center justify-center select-none">
                  
                  {/* Flecha Navegación Izquierda */}
                  {actualMediaIndex > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActualMediaIndex((prev) => prev - 1);
                      }}
                      className="absolute left-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md backdrop-blur-sm opacity-0 group-hover/gallery:opacity-100 transition-all duration-200 hover:scale-105"
                      aria-label="Imagen anterior"
                    >
                      <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                  )}

                  {/* Renderizado de Recurso Actual (Imagen o Video) */}
                  {isVideo(galeriaMedia[actualMediaIndex]) ? (
                    <video
                      src={galeriaMedia[actualMediaIndex]}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={galeriaMedia[actualMediaIndex]}
                      alt={terreno.titulo}
                      className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"
                      onClick={() => setModalMediaUrl(galeriaMedia[actualMediaIndex])}
                    />
                  )}

                  {/* Flecha Navegación Derecha */}
                  {actualMediaIndex < galeriaMedia.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActualMediaIndex((prev) => prev + 1);
                      }}
                      className="absolute right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md backdrop-blur-sm opacity-0 group-hover/gallery:opacity-100 transition-all duration-200 hover:scale-105"
                      aria-label="Siguiente imagen"
                    >
                      <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  )}

                  {/* Indicador Flotante Numérico (Ej: 1 / 3) */}
                  {galeriaMedia.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md tracking-wider">
                      {actualMediaIndex + 1} / {galeriaMedia.length}
                    </div>
                  )}

                  {/* Etiquetas de Estado sobrepuestas */}
                  <Badge className="absolute top-4 right-4 bg-green-600 hover:bg-green-600 text-white border-none font-semibold shadow-sm" variant="secondary">
                    {terreno.tipo}
                  </Badge>
                  {terreno.status === "vendido" && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-md tracking-wide uppercase">
                      VENDIDO
                    </div>
                  )}
                </div>

                {/* Sección de Miniaturas Deslizables Inferiores */}
                {galeriaMedia.length > 1 && (
                  <div className="p-4 bg-white border-t border-gray-50">
                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                      {galeriaMedia.map((item: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActualMediaIndex(idx)}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 border-2 outline-none ${
                            actualMediaIndex === idx 
                              ? "border-blue-600 shadow-sm ring-2 ring-blue-100" 
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {isVideo(item) ? (
                            <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
                              <video src={item} muted className="w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex items-center justify-center text-white">
                                <svg xmlns="http://w3.org" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow">
                                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item}
                              alt={`Miniatura descriptiva \${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


                      {/* CARD 1: RESUMEN DE ATRIBUTOS PRINCIPALES Y DESCRIPCIÓN */}
          <Card className="shadow-sm border-gray-100 mb-6">
          {/* TÍTULO PRINCIPAL DE LA PROPIEDAD */}
          <div className="mb-5">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {terreno.titulo}
            </h1>
            {terreno.tipo && (
              <span className="inline-block mt-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                Terreno {terreno.tipo}
              </span>
            )}
          </div>

          {/* CARD 1: RESUMEN DE ATRIBUTOS PRINCIPALES Y DESCRIPCIÓN */}
          <Card className="shadow-sm border-gray-100 mb-6">
            {/* ... Contenido interno de tu Card 1 (Precio, Área, Descripción) */}
          </Card>

          {/* SECCIÓN: DIRECCIÓN Y UBICACIÓN INTERACTIVA (Poner dentro de la grilla de detalles) */}
          <div className="border-b border-gray-50 pb-4 md:border-none md:pb-0 md:col-span-2">
            <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              Dirección y Ubicación
            </h4>

            {(() => {
              const textoCompleto = terreno.ubicacion || "";
              const urlRegex = /https?:\/\/[^\s\]]+/g;
              const links = textoCompleto.match(urlRegex);
              const direccionLimpia = textoCompleto.replace(urlRegex, "").trim();

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 font-semibold text-sm break-words">
                      {direccionLimpia || "Dirección detallada en el mapa satelital"}
                    </p>
                  </div>
                  
                  {links && links.length > 0 ? (
                    <a 
                      href={links[0]} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all w-full sm:w-auto justify-center flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://w3.org">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75 3.75 6v11.25l5.25-2.25 6 2.25 5.25-2.25V3.75l-5.25 2.25-6-2.25Z" />
                      </svg>
                      Ver Ubicación en Google Maps
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic flex-shrink-0">Mapa no disponible</span>
                  )}
                </div>
              );
            })()}
          </div>



            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Resumen de la Propiedad</CardTitle>
            </CardHeader>
            <CardContent>
                           {/* Cuadrícula de Atributos Principales Adaptativa (Mantiene siempre mínimo 2 columnas) */}
              <div className={`grid gap-3 mb-6 ${
                detalles.habitaciones > 0 || detalles.banos > 0 || detalles.pisos > 0 
                  ? "grid-cols-2 sm:grid-cols-4" 
                  : "grid-cols-2"
              }`}>
                {/* Caja de Precio Controlada */}
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-100 min-w-0 overflow-hidden flex flex-col justify-center">
                  <h4 className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-green-800 mb-1 flex-shrink-0">Precio</h4>
                  <p className="text-sm xs:text-base sm:text-xl md:text-2xl font-black text-green-600 truncate break-all">
                    {formatPrecio(terreno.precio, terreno.moneda)}
                  </p>
                </div>
                
                {/* Caja de Área Total Controlada */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 min-w-0 overflow-hidden flex flex-col justify-center">
                  <h4 className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-blue-800 mb-1 flex-shrink-0">Área Total</h4>
                  <p className="text-sm xs:text-base sm:text-xl md:text-2xl font-black text-blue-600 truncate">
                    {terreno.area} <span className="text-[10px] sm:text-sm font-normal text-blue-500">m²</span>
                  </p>
                </div>

                {/* Habitaciones condicionales */}
                {detalles.habitaciones > 0 && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col justify-center min-w-0">
                    <h4 className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 mb-1">Habitaciones</h4>
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">{detalles.habitaciones}</p>
                  </div>
                )}

                {/* Baños condicionales */}
                {detalles.banos > 0 && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col justify-center min-w-0">
                    <h4 className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 mb-1">Baños</h4>
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">{detalles.banos}</p>
                  </div>
                )}
              </div>


              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-2">Descripción de la propiedad</h4>
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{terreno.descripcion}</p>
              </div>
            </CardContent>
          </Card>

          {/* {/* CARD 2: ESPECIFICACIONES Y DETALLES TÉCNICOS */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Especificaciones y Detalles Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Dimensiones del lote */}
                  <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                    <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h16.5m-16.5 16.5h16.5m-16.5-16.5v16.5m16.5-16.5v16.5M7.5 7.5h9v9h-9z" />
                      </svg>
                      Dimensiones del lote
                    </h4>
                    <p className="text-gray-900 font-medium">{detalles.dimensiones || "No especificado"}</p>
                  </div>

                  {/* Topografía */}
                  <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                    <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18s1.5-2 4.5-2 4.5 3 7.5 3 4.5-4 7.5-4m-19.5 7h19.5" />
                      </svg>
                      Topografía
                    </h4>
                    <p className="text-gray-900 font-medium uppercase">{detalles.topografia || "No especificado"}</p>
                  </div>

                  {/* Tipo de Acceso */}
                  <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                    <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-8.25V15m-11.25.75h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 5.25v8.25a1.5 1.5 0 0 0 1.5 1.5M12 15.75v5.25" />
                      </svg>
                      Tipo de Acceso
                    </h4>
                    <p className="text-gray-900 font-medium uppercase">{detalles.acceso || "No especificado"}</p>
                  </div>

                  {/* Zonificación */}
                  <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                    <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h6m-6 3h6m-6 3h6m3.75 3.75h-15a1.5 1.5 0 0 1-1.5-1.5V4.5a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5Z" />
                      </svg>
                      Zonificación
                    </h4>
                    <p className="text-gray-900 font-medium uppercase">{detalles.zonificacion || "No especificado"}</p>
                  </div>

                  {/* Nivel de Pisos */}
                  {detalles.pisos > 0 && (
                    <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                      <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75M3 3h18" />
                        </svg>
                        Nivel de Pisos
                      </h4>
                      <p className="text-gray-900 font-medium">
                        {detalles.pisos} {detalles.pisos === 1 ? 'Piso construido' : 'Pisos construidos'}
                      </p>
                    </div>
                  )}

                  {/* Servicios Disponibles */}
                  <div className="border-b border-gray-50 pb-3 md:border-none md:pb-0">
                    <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                      </svg>
                      Servicios Disponibles
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {detalles.servicios ? (
                        (typeof detalles.servicios === 'string' ? detalles.servicios.split(',') : detalles.servicios)
                          .filter((s: string) => s.trim() !== "")
                          .map((servicio: string, index: number) => (
                            <span key={index} className="bg-gray-100 text-gray-700 font-medium text-xs py-0.5 px-2.5 rounded-md">
                              {servicio.trim()}
                            </span>
                          ))
                      ) : (
                        <p className="text-gray-400 italic text-sm">Ninguno especificado</p>
                      )}
                    </div>
                  </div>

                  
                
                {/* Situación Legal / Documentación */}
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.636m-5.8 0a2.25 2.25 0 0 0-1.096 1.958v6.49c0 1.242.1 2.47.3 3.688M17.166 3.836A2.25 2.25 0 0 1 18.261 5.794v6.49c0 1.242-.1 2.47-.3 3.688M8.111 16.111l2.445-2.445m0 0 2.444 2.445m-2.444-2.445v5.333" />
                    </svg>
                    Situación Legal / Documentación
                  </h4>
                  <p className="text-gray-900 font-medium uppercase text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block min-w-[250px] mt-1">
                    {detalles.documentos || "No especificada / En proceso"}
                  </p>
                </div>
              </div>
              
              {/* Botón de edición exclusivo para el dueño de la publicación */}
              {currentUser?.id === terreno.user_id && (
                <div className="mt-8 border-t border-gray-100 pt-5">
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-all shadow-sm py-5 rounded-xl"
                    onClick={() => (window.location.href = `/editar/${terreno.id}`)}
                  >
                    Editar publicación
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          </div>


                  {/* COLUMNA DERECHA: PANEL DE CONTACTO ADAPTADO */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-md border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-lg font-bold text-gray-900">
                  ¿Interesado en esta propiedad?
                </CardTitle>
                <p>Contáctanos si desea una visita guiada a la propiedad</p>
              </CardHeader>
              <CardContent className="space-y-3.5">
                
                {/* Botón de Formulario */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-xl shadow-sm transition-colors duration-200"
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" /> 
                  {mostrarFormulario ? "Ocultar Formulario" : "Solicitar Información"}
                </Button>

                {/* Botón de Correo Directo */}
                <a href={gmailLink} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-5 rounded-xl shadow-sm transition-colors duration-200">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" /> Enviar Email
                  </Button>
                </a>

                {/* Botón de WhatsApp Corporativo Saneado y 100% Funcional */}
                <a
                  href={whatsappLinkFinal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full no-underline"
                  aria-label="Contactar a BITAFAM vía WhatsApp"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-xl shadow-sm transition-all duration-200">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" /> WhatsApp BITAFAM
                  </Button>
                </a>



                {/* Componente del Formulario de Contacto */}
                {mostrarFormulario && (
                  <div className="mt-4 p-1 animate-in fade-in slide-in-from-top-3 duration-200">
                    <ContactForm terrenoId={terreno.id} />
                  </div>
                )}

                {/* Información de Contacto Profesionalizada */}
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 mt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Información de Contacto
                  </h4>
                  <div className="space-y-2.5 text-sm text-gray-700 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href="tel:+51998026135" className="hover:text-blue-600 transition-colors">998 026 135</a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href="mailto:grupobitafam@gmail.com" className="hover:text-blue-600 transition-colors">grupobitafam@gmail.com</a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>Alfonso Ugarte 101, Ayacucho</span>
                    </div>
                  </div>
                </div>

                {/* Horarios de Atención */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-800 mb-2">
                    Horarios de Atención
                  </h4>
                  <div className="space-y-1 text-sm text-blue-700 font-medium">
                    <div className="flex justify-between"><span>Lunes a Viernes:</span> <span className="font-semibold">9:00 AM - 6:00 PM</span></div>
                    <div className="flex justify-between"><span>Sábados:</span> <span className="font-semibold">9:00 AM - 2:00 PM</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* Lightbox / Modal de Medios a Pantalla Completa Interactivo */}
      {modalMediaUrl && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          {/* Botón de Cerrar Flotante */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 text-white p-2.5 bg-gray-900/80 hover:bg-gray-800 rounded-full transition shadow-lg group border border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>

          {/* Flecha de Navegación Izquierda en Pantalla Completa */}
          {actualMediaIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nuevoIndex = actualMediaIndex - 1;
                setActualMediaIndex(nuevoIndex);
                setModalMediaUrl(galeriaMedia[nuevoIndex]); // Actualiza la imagen del modal
              }}
              className="absolute left-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 border border-white/10"
              aria-label="Imagen anterior"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Contenedor central del recurso multimedia */}
          <div className="max-h-[90vh] max-w-[95vw] relative flex items-center justify-center">
            {isVideo(galeriaMedia[actualMediaIndex]) ? (
              <video
                src={galeriaMedia[actualMediaIndex]}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[95vw] rounded-xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={galeriaMedia[actualMediaIndex]}
                alt="Visualización a pantalla completa"
                className="max-h-[90vh] max-w-[95vw] rounded-xl shadow-2xl object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Flecha de Navegación Derecha en Pantalla Completa */}
          {actualMediaIndex < galeriaMedia.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nuevoIndex = actualMediaIndex + 1;
                setActualMediaIndex(nuevoIndex);
                setModalMediaUrl(galeriaMedia[nuevoIndex]); // Actualiza la imagen del modal
              }}
              className="absolute right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 border border-white/10"
              aria-label="Siguiente imagen"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Contador de posición discreto inferior en Pantalla Completa */}
          {galeriaMedia.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wider shadow-md">
              {actualMediaIndex + 1} / {galeriaMedia.length}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TerrenoDetalle;


