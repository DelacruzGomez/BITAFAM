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
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface Terreno {
  id: string;
  title: string;         // Ajusta según tu DB (puede ser `titulo`)
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
}

export default function ListaTerrenos() {
  const { user } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Hook para navegar

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

    const { error } = await supabase
      .from('land_properties')
      .update({ status: 'vendido' })
      .eq('id', id);

    if (!error) {
      setTerrenos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'vendido' } : t))
      );
    } else {
      console.error('Error al marcar como vendido:', error);
    }
  };

  const marcarComoDisponible = async (id: string) => {
    if (!window.confirm('¿Quieres marcar este terreno como disponible nuevamente?')) return;

    const { error } = await supabase
      .from('land_properties')
      .update({ status: 'disponible' })
      .eq('id', id);

    if (!error) {
      setTerrenos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'disponible' } : t))
      );
    } else {
      console.error('Error al marcar como disponible:', error);
    }
  };

  const eliminarTerreno = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este terreno? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('land_properties')
      .delete()
      .eq('id', id);

    if (!error) {
      setTerrenos((prev) => prev.filter((t) => t.id !== id));
    } else {
      console.error('Error al eliminar terreno:', error);
    }
  };

  const terrenosPropios = terrenos.filter((t) => t.user_id === user?.id);
  const terrenosOtros = terrenos.filter((t) => t.user_id !== user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        <span className="ml-4 text-lg">Cargando terrenos...</span>
        <style>{`
          .loader {
            border-top-color: #4ade80;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4">
      {/* Botón Volver */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center space-x-2"
        type="button"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Atrás</span>
      </Button>

      {/* Portada */}
      <section
        aria-label="Portada"
        className="relative h-64 rounded-md overflow-hidden mb-8 shadow-lg"
      >
        <img
          src="/fondo.png" // Cambia esta ruta si la tienes en otro lugar
          alt="Imagen de portada de terrenos"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Terrenos disponibles</h1>
        </div>
      </section>

      {/* Mis terrenos */}
      {user && (
        <section aria-label="Mis terrenos" className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Mis terrenos</h2>
          {terrenosPropios.length === 0 ? (
            <p>No has publicado terrenos aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {terrenosPropios.map((t) => (
                <TerrenoCard
                  key={t.id}
                  terreno={t}
                  esPropio
                  onVender={() => marcarComoVendido(t.id)}
                  onActivar={() => marcarComoDisponible(t.id)}
                  onEliminar={() => eliminarTerreno(t.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Otros terrenos */}
      <section aria-label="Otros terrenos">
        <h2 className="text-2xl font-semibold mb-4">Otros terrenos</h2>
        {terrenosOtros.length === 0 ? (
          <p>No hay más terrenos publicados aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {terrenosOtros.map((t) => (
              <TerrenoCard key={t.id} terreno={t} />
            ))}
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
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={terreno.portada || terreno.image_url || '/no-imagen.png'}
          alt={terreno.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {terreno.tipo && (
          <Badge className="absolute top-2 right-2 bg-green-600 text-white capitalize">
            {terreno.tipo}
          </Badge>
        )}
        {terreno.status === 'vendido' && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
            VENDIDO
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg text-gray-800">{terreno.title}</CardTitle>
        <CardDescription className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {terreno.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-3">{terreno.description}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-green-600">
            {terreno.precio ? `S/. ${terreno.precio.toLocaleString()}` : '-'}
          </span>
          <span className="text-gray-500 font-medium">{terreno.area ?? '-'}</span>
        </div>

        <Link to={`/terreno/${terreno.id}`}>
          <Button className="w-full bg-green-600 hover:bg-green-700 mb-2">
            Ver Detalles
          </Button>
        </Link>

        {esPropio ? (
          <div className="flex flex-col gap-2">
            {terreno.status === 'disponible' ? (
              <Button variant="outline" onClick={onVender} type="button">
                Marcar como vendido
              </Button>
            ) : (
              <Button variant="outline" onClick={onActivar} type="button">
                Marcar como disponible
              </Button>
            )}
            <Button variant="destructive" onClick={onEliminar} type="button">
              Eliminar
            </Button>
          </div>
        ) : (
          <a
            href={`https://wa.me/${terreno.whatsapp ?? '51999999999'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline block text-center mt-2"
            aria-label="Contactar al propietario vía WhatsApp"
          >
            <Button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700">
              <Phone className="h-4 w-4" />
              <span>Contactar al propietario</span>
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
