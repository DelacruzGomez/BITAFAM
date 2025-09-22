import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

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
  status: "disponible" | "vendido";
  dimensiones: string;
  topografia: string;
  acceso: string;
  zonificacion: string;
  servicios: string;
  documentacion: string;
  videos?: string[];
  portada?: string;
}

export function LandDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [land, setLand] = useState<LandProperty | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LandProperty>>({});
  const [selectedPortada, setSelectedPortada] = useState<string>("");

  useEffect(() => {
    async function fetchLand() {
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setLand(data);
        setFormData(data);
        const portada = data.portada || data.imagen || (data.videos && data.videos[0]) || "";
        setSelectedPortada(portada);
      } else {
        console.error("Error al obtener el terreno:", error?.message);
      }
    }
    if (id) fetchLand();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue =
      name === "precio" || name === "area" ? parseFloat(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleUpdate = async () => {
    if (!land) return;
    const updateData = { ...formData, portada: selectedPortada };
    const { data, error } = await supabase
      .from("land_properties")
      .update(updateData)
      .eq("id", land.id)
      .select()
      .single();
    if (data) {
      setLand(data);
      setIsEditing(false);
      alert("Terreno actualizado correctamente");
    } else {
      console.error("Error al actualizar:", error?.message);
      alert("Error al actualizar el terreno");
    }
  };

  if (!land) return <p className="p-4">Cargando terreno...</p>;

  const isOwner = land.user_id === user?.id;

  const isVideo = (url: string) =>
    url?.toLowerCase().endsWith(".mp4") || url?.includes("video");

  // Galería que incluye videos e imagenes
  const galeria = [...(land.videos || []), land.imagen].filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      {isEditing ? (
        <>
          <input
            name="titulo"
            value={formData.titulo || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Título"
          />
          <textarea
            name="descripcion"
            value={formData.descripcion || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Descripción"
          />
          <input
            name="precio"
            value={formData.precio || ""}
            onChange={handleChange}
            type="number"
            className="w-full p-2 border mb-2"
            placeholder="Precio"
          />
          <input
            name="area"
            value={formData.area || ""}
            onChange={handleChange}
            type="number"
            className="w-full p-2 border mb-2"
            placeholder="Área"
          />
          <input
            name="ubicacion"
            value={formData.ubicacion || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Ubicación"
          />
          <input
            name="tipo"
            value={formData.tipo || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Tipo de terreno"
          />
          <input
            name="imagen"
            value={formData.imagen || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="URL de imagen"
          />
          <input
            name="dimensiones"
            value={formData.dimensiones || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Dimensiones"
          />
          <input
            name="topografia"
            value={formData.topografia || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Topografía"
          />
          <input
            name="acceso"
            value={formData.acceso || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Acceso"
          />
          <input
            name="zonificacion"
            value={formData.zonificacion || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Zonificación"
          />
          <input
            name="servicios"
            value={formData.servicios || ""}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            placeholder="Servicios disponibles"
          />
          <input
            name="documentacion"
            value={formData.documentacion || ""}
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
          <h2 className="text-3xl font-bold mb-4">{land.titulo}</h2>

          <div className="border rounded shadow mb-4 max-h-[500px] flex justify-center items-center overflow-hidden mx-auto">
            {isVideo(selectedPortada) ? (
              <video
                src={selectedPortada}
                controls
                className="max-w-full max-h-[500px] object-contain rounded"
              />
            ) : (
              <img
                src={selectedPortada}
                alt={land.titulo}
                className="max-w-full max-h-[500px] object-cover"
              />
            )}
          </div>

          <div className="flex space-x-2 overflow-x-auto mb-6 max-w-full">
            {galeria.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPortada(item)}
                className={`flex-shrink-0 border rounded overflow-hidden ${
                  selectedPortada === item ? "border-blue-600" : "border-gray-300"
                }`}
                aria-label={`Mostrar ${isVideo(item) ? "video" : "imagen"} ${idx + 1}`}
              >
                {isVideo(item) ? (
                  <video
                    src={item}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-20 w-32 object-cover cursor-pointer rounded"
                  />
                ) : (
                  <img
                    src={item}
                    alt={`miniatura ${idx + 1}`}
                    className="h-20 w-32 object-cover cursor-pointer rounded"
                  />
                )}
              </button>
            ))}
          </div>

          <p>
            <strong>Precio:</strong> S/. {land.precio}
          </p>
          <p>
            <strong>Área:</strong> {land.area} m²
          </p>
          <p>
            <strong>Ubicación:</strong> {land.ubicacion}
          </p>
          <p>
            <strong>Tipo:</strong> {land.tipo}
          </p>
          <p>
            <strong>Estado:</strong> {land.status}
          </p>
          <p className="text-sm text-gray-500">
            Publicado el: {new Date(land.created_at).toLocaleDateString()}
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Detalles del Terreno</h3>
          <div className="space-y-1">
            <p>
              <strong>Dimensiones:</strong> {land.dimensiones || "No especificado"}
            </p>
            <p>
              <strong>Topografía:</strong> {land.topografia || "No especificado"}
            </p>
            <p>
              <strong>Acceso:</strong> {land.acceso || "No especificado"}
            </p>
            <p>
              <strong>Zonificación:</strong> {land.zonificacion || "No especificado"}
            </p>
            <p>
              <strong>Servicios Disponibles:</strong> {land.servicios || "No especificado"}
            </p>
            <p>
              <strong>Documentación:</strong> {land.documentacion || "No especificado"}
            </p>
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
