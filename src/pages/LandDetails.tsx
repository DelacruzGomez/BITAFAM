import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

interface LandProperty {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  ubicacion: string;
  imagen: string;
  tipo: string;
  created_at: string;
  area: number;
  status: 'disponible' | 'vendido';
  dimensiones: string;
  topografia: string;
  acceso: string;
  zonificacion: string;
  servicios: string;
  documentacion: string;
}

export function LandDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [land, setLand] = useState<LandProperty | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LandProperty>>({});

  useEffect(() => {
    async function fetchLand() {
      const { data, error } = await supabase
        .from('land_properties')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setLand(data);
        setFormData(data);
      } else {
        console.error('Error al obtener el terreno:', error?.message);
      }
    }

    if (id) fetchLand();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue =
      name === 'precio' || name === 'area' ? parseFloat(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleUpdate = async () => {
    if (!land) return;

    const { data, error } = await supabase
      .from('land_properties')
      .update(formData)
      .eq('id', land.id)
      .select()
      .single();

    if (data) {
      setLand(data);
      setIsEditing(false);
      alert('Terreno actualizado correctamente');
    } else {
      console.error('Error al actualizar:', error?.message);
      alert('Error al actualizar el terreno');
    }
  };

  if (!land) return <p className="p-4">Cargando terreno...</p>;

  const isOwner = land.user_id === user?.id;

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      {isEditing ? (
        <>
          <input
            name="titulo"
            value={formData.titulo || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Título"
          />
          <textarea
            name="descripcion"
            value={formData.descripcion || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Descripción"
          />
          <input
            name="precio"
            value={formData.precio || ''}
            onChange={handleChange}
            type="number"
            className="w-full p-2 border mb-2"
            placeholder="Precio"
          />
          <input
            name="area"
            value={formData.area || ''}
            onChange={handleChange}
            type="number"
            className="w-full p-2 border mb-2"
            placeholder="Área"
          />
          <input
            name="ubicacion"
            value={formData.ubicacion || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Ubicación"
          />
          <input
            name="tipo"
            value={formData.tipo || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Tipo de terreno"
          />
          <input
            name="imagen"
            value={formData.imagen || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="URL de imagen"
          />
          <input
            name="dimensiones"
            value={formData.dimensiones || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Dimensiones"
          />
          <input
            name="topografia"
            value={formData.topografia || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Topografía"
          />
          <input
            name="acceso"
            value={formData.acceso || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Acceso"
          />
          <input
            name="zonificacion"
            value={formData.zonificacion || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Zonificación"
          />
          <input
            name="servicios"
            value={formData.servicios || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Servicios disponibles"
          />
          <input
            name="documentacion"
            value={formData.documentacion || ''}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Documentación"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleUpdate}>Guardar</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold">{land.titulo}</h2>
          <img
            src={land.imagen}
            alt={land.titulo}
            className="w-full h-64 object-cover rounded my-4"
          />
          <p><strong>Precio:</strong> S/. {land.precio}</p>
          <p><strong>Área:</strong> {land.area} m²</p>
          <p><strong>Ubicación:</strong> {land.ubicacion}</p>
          <p><strong>Tipo:</strong> {land.tipo}</p>
          <p><strong>Estado:</strong> {land.status}</p>
          <p className="text-sm text-gray-500">
            Publicado el: {new Date(land.created_at).toLocaleDateString()}
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Detalles del Terreno</h3>
          <div className="space-y-1">
            <p><strong>Dimensiones:</strong> {land.dimensiones || 'No especificado'}</p>
            <p><strong>Topografía:</strong> {land.topografia || 'No especificado'}</p>
            <p><strong>Acceso:</strong> {land.acceso || 'No especificado'}</p>
            <p><strong>Zonificación:</strong> {land.zonificacion || 'No especificado'}</p>
            <p><strong>Servicios Disponibles:</strong> {land.servicios || 'No especificado'}</p>
            <p><strong>Documentación:</strong> {land.documentacion || 'No especificado'}</p>
          </div>

          {isOwner && (
            <div className="mt-6">
              <Button onClick={() => setIsEditing(true)}>Editar terreno</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
