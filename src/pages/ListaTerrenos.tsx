// src/pages/ListaTerrenos.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

// 1. Importaciones oficiales nativas de Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';

// 2. Importaciones de los estilos de Swiper integrados en tu build de Vite
import 'swiper/css';
import 'swiper/css/effect-coverflow';

interface Terreno {
  id: string;
  title: string;       
  description: string;
  location: string;
  image_url: string;
  portada?: string | null;
  status: 'disponible' | 'vendido';
  user_id: string;
  created_at: string;
  whatsapp?: string;
  precio?: number;
  area?: string;
  tipo?: string;
  moneda?: string;
  zonificacion?: string;
  habitaciones?: number;
  banos?: number;
  pisos?: number;
}

export default function ListaTerrenos() {
  const { user } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerrenos = async () => {
      const { data, error } = await supabase
        .from('land_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener terrenos', error);
      } else {
        setTerrenos(data || []);
      }
      setLoading(false);
    };

    fetchTerrenos();
  }, []);

  const marcarComoVendido = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres marcar este terreno como vendido?')) return;
    const { error } = await supabase.from('land_properties').update({ status: 'vendido' }).eq('id', id);
    if (!error) {
      setTerrenos((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'vendido' } : t)));
    }
  };

  const marcarComoDisponible = async (id: string) => {
    if (!window.confirm('¿Quieres marcar este terreno como disponible nuevamente?')) return;
    const { error } = await supabase.from('land_properties').update({ status: 'disponible' }).eq('id', id);
    if (!error) {
      setTerrenos((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'disponible' } : t)));
    }
  };

  const eliminarTerreno = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este terreno? This action cannot be undone.')) return;
    const { error } = await supabase.from('land_properties').delete().eq('id', id);
    if (!error) {
      setTerrenos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const terrenosPropios = terrenos.filter((t) => t.user_id === user?.id);
  const terrenosOtros = terrenos.filter((t) => t.user_id !== user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 font-sans">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        <span className="ml-4 text-lg font-medium text-gray-600">Cargando terrenos...</span>
        <style>{`
          .loader { border-top-color: #4ade80; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        `}</style>
      </div>
    );
  }
  return (
    /* Reemplaza la etiqueta de apertura <main> por esta línea con estilo directo */
<main className="max-w-7xl mx-auto p-4 font-sans text-[#1e1e1e] overflow-hidden" style={{ display: 'block', width: '100%' }}>

      {/* Botón Volver */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center space-x-2 rounded-full border-gray-200"
        type="button"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Atrás</span>
      </Button>

      {/* Portada */}
      <section aria-label="Portada" className="relative h-64 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <img src="/fondo.png" alt="Imagen de portada de terrenos" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-sm tracking-tight">
            Terrenos disponibles
          </h1>
        </div>
      </section>

      {/* Slider: Mis terrenos */}
      {user && (
        <section aria-label="Mis terrenos" className="mb-10 w-full py-4 block">
          <h2 className="text-2xl font-bold mb-6 tracking-tight px-1">Mis terrenos</h2>
          {terrenosPropios.length === 0 ? (
            <p className="text-gray-500 font-light px-1">No has publicado terrenos aún.</p>
          ) : (
            <div style={{ display: 'block', width: '100%', overflow: 'hidden', position: 'relative' }}>
              <Swiper
                modules={[EffectCoverflow]}
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                loop={terrenosPropios.length > 2}
                coverflowEffect={{
                  rotate: 25,
                  stretch: -15,
                  depth: 150,
                  modifier: 1,
                  slideShadows: true,
                }}
                className="w-full"
                style={{ width: '100%', padding: '20px 0' }}
              >
                {terrenosPropios.map((t) => (
                  <SwiperSlide 
                    key={t.id} 
                    className="!w-[320px] !h-auto p-2"
                    style={{ flexShrink: 0, display: 'block' }}
                  >
                    <TerrenoCard
                      terreno={t}
                      esPropio
                      onVender={() => marcarComoVendido(t.id)}
                      onActivar={() => marcarComoDisponible(t.id)}
                      onEliminar={() => eliminarTerreno(t.id)}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </section>
      )}

      {/* Slider: Otros terrenos */}
      <section aria-label="Otros terrenos" className="w-full py-4 block">
        <h2 className="text-2xl font-bold mb-6 tracking-tight px-1">Otros terrenos</h2>
        {terrenosOtros.length === 0 ? (
          <p className="text-gray-500 font-light px-1">No hay más terrenos publicados aún.</p>
        ) : (
          <div style={{ display: 'block', width: '100%', overflow: 'hidden', position: 'relative' }}>
            <Swiper
              modules={[EffectCoverflow]}
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              loop={terrenosOtros.length > 2}
              coverflowEffect={{
                rotate: 25,
                stretch: -15,
                depth: 150,
                modifier: 1,
                slideShadows: true,
              }}
              className="w-full clean-swiper-container"
              style={{ display: 'block', width: '100%' }}
            >
              {terrenosOtros.map((t) => (
                <SwiperSlide 
                  key={t.id} 
                  className="!w-[320px] !h-auto p-2"
                  style={{ flexShrink: 0, display: 'block' }}
                >
                  <TerrenoCard terreno={t} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
    </main>
  );
}
function TerrenoCard({
  terreno,
  esPropio = false,
  onVender,
  onEliminar,
  onActivar,
}: {
  terreno: Terreno;
  esPropio?: boolean;
  onVender?: () => void;
  onEliminar?: () => void;
  onActivar?: () => void;
}) {
  const navigate = useNavigate();
  
  const obtenerEtiquetas = (desc: string) => {
    if (!desc) return [];
    return desc
      .split('*')
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.toLowerCase().includes('soles') && !item.toLowerCase().includes('precio'));
  };

  const etiquetas = obtenerEtiquetas(terreno.description);
  const t = terreno as any;

  return (
    <Card className="h-full hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden border border-gray-100 flex flex-col justify-between font-sans bg-white">
      <div>
        {/* Contenedor de Imagen */}
        <div className="relative overflow-hidden h-52 bg-gray-50">
          <img
            src={terreno.portada || terreno.image_url || '/no-imagen.png'}
            alt={terreno.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          {terreno.tipo && (
            <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full px-3 py-0.5 text-xs capitalize tracking-wide border-none shadow-sm">
              {terreno.tipo}
            </Badge>
          )}
          {terreno.status === 'vendido' && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-0.5 text-[10px] font-bold rounded-full tracking-wider shadow-sm">
              VENDIDO
            </div>
          )}
        </div>

        {/* Encabezado de Tarjeta */}
        <CardHeader className="p-4 pb-1 space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Propiedad inmobiliaria
          </span>
          <CardTitle className="text-base font-bold uppercase tracking-tight text-gray-900 leading-snug line-clamp-1">
            {terreno.title}
          </CardTitle>
          <CardDescription className="flex items-center text-xs font-normal text-gray-500 pt-0.5">
            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{terreno.location}</span>
          </CardDescription>
        </CardHeader>

        {/* Características Técnicas */}
        <CardContent className="p-4 pt-1 pb-2 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-gray-600 font-semibold border-b border-gray-50 pb-2.5">
            <div className="flex items-center gap-1" title="Área total">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M15 4v16M4 9h16M4 15h16" />
              </svg>
              <span>{terreno.area || '-'} <span className="text-gray-400 font-normal text-[10px]">m²</span></span>
            </div>

            {t.habitaciones > 0 && (
              <div className="flex items-center gap-1" title="Habitaciones">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M5.25 6h13.5A1.5 1.5 0 0120.25 7.5v4.5H3.75v-4.5A1.5 1.5 0 015.25 6zM3.75 15.75v2.25m16.5-2.25v2.25" />
                </svg>
                <span>{t.habitaciones} <span className="text-gray-400 font-normal text-[10px]">hab</span></span>
              </div>
            )}

            {t.banos > 0 && (
              <div className="flex items-center gap-1" title="Baños">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 7.5h2.25M3 19.5h18M18 19.5v-9A2.25 2.25 0 0015.75 8.25H8.25A2.25 2.25 0 006 10.5v9M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3M10.5 12h3" />
                </svg>
                <span>{t.banos} <span className="text-gray-400 font-normal text-[10px]">baño</span></span>
              </div>
            )}
          </div>

          {etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1 pb-1">
              {etiquetas.slice(0, 3).map((etiqueta, index) => (
                <span key={index} className="bg-gray-50 text-gray-600 border border-gray-100 rounded-md px-2 py-0.5 text-[10px] font-normal capitalize">
                  {etiqueta}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col border-t border-gray-50 pt-2.5">
            <span className="text-xl font-bold tracking-tight text-gray-950">
              {terreno.precio ? `S/ ${terreno.precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              Precio Fijo {terreno.zonificacion ? `• ${terreno.zonificacion}` : ''}
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {/* Botón Principal unificado */}
        <Link to={`/terreno/${terreno.id}`} className="block w-full pt-0.5">
          <Button variant="outline" className="w-full rounded-full border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50">
            Ver Detalles
          </Button>
        </Link>

        {/* Renderizado de Controles de Gestión o Enlace de WhatsApp */}
        {esPropio ? (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 w-full">
            {terreno.status === 'disponible' ? (
              <Button variant="outline" onClick={onVender} type="button" className="rounded-full text-[11px] py-1.5 h-8">
                Marcar como vendido
              </Button>
            ) : (
              <Button variant="outline" onClick={onActivar} type="button" className="rounded-full text-[11px] py-1.5 h-8">
                Marcar como disponible
              </Button>
            )}
            <Button variant="destructive" onClick={onEliminar} type="button" className="rounded-full text-[11px] py-1.5 h-8">
              Eliminar
            </Button>
          </div>
        ) : (
          <a
            href={`https://wa.me{terreno.whatsapp ?? '51998026135'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 no-underline w-full"
            aria-label="Contactar a BITAFAM vía WhatsApp"
          >
            <Button className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold py-2">
              <Phone className="h-4 w-4" />
              <span>Contactar WhatsApp</span>
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
