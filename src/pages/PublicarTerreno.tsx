// src/pages/PublicarTerreno.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function PublicarTerreno() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [area, setArea] = useState("");
  const [tipo, setTipo] = useState("urbano");
  const [imagenes, setImagenes] = useState<string[]>([]); // ahora solo URLs
  const [portadaIndex, setPortadaIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dimensiones, setDimensiones] = useState("");
  const [topografia, setTopografia] = useState("");
  const [acceso, setAcceso] = useState("");
  const [zonificacion, setZonificacion] = useState("");
  const [servicios, setServicios] = useState("");
  const [documentacion, setDocumentacion] = useState("");

  const navigate = useNavigate();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const fileName = `terrenos/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("land-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert("Error al subir una imagen");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("land-images")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setImagenes((prev) => [...prev, urlData.publicUrl]);
      }
    }
  };

  const handleAddImageUrl = (url: string) => {
    if (url.trim() && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
      setImagenes((prev) => [...prev, url.trim()]);
    } else {
      alert("Ingresa una URL válida de imagen");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      alert("Debes iniciar sesión para publicar un terreno.");
      setLoading(false);
      return;
    }

    const user = authData.user;

    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (userError || !userExists) {
      alert("Tu cuenta no está registrada en la base de datos de usuarios.");
      setLoading(false);
      return;
    }

    const portada = imagenes[portadaIndex] || null;

    const { error: insertError } = await supabase.from("land_properties").insert({
      user_id: user.id,
      titulo,
      descripcion,
      precio: parseFloat(precio),
      ubicacion,
      imagen: portada, // columna portada (string)
      imagenes, // columna array
      area: parseFloat(area),
      tipo,
      status: "disponible",
      dimensiones,
      topografia,
      acceso,
      zonificacion,
      servicios,
      documentacion,
    });

    if (insertError) {
      console.error(insertError);
      alert("Error al registrar terreno: " + insertError.message);
      setLoading(false);
      return;
    }

    alert("Terreno registrado exitosamente");
    navigate("/");
   // navigate("/ListaTerrenos");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      
      <h2 className="text-2xl font-bold mb-4 text-center">Publicar Terreno</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Área en m² (ej: 120)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="residencial">Residencial</option>
          <option value="comercial">Comercial</option>
          <option value="industrial">Industrial</option>
          <option value="campestre">Campestre</option>
          <option value="rural">Rural</option>
          <option value="urbano">Urbano</option>
        </select>

        <input
          type="text"
          placeholder="Dimensiones"
          value={dimensiones}
          onChange={(e) => setDimensiones(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Topografía"
          value={topografia}
          onChange={(e) => setTopografia(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Acceso"
          value={acceso}
          onChange={(e) => setAcceso(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Zonificación"
          value={zonificacion}
          onChange={(e) => setZonificacion(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Servicios disponibles"
          value={servicios}
          onChange={(e) => setServicios(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Documentación"
          value={documentacion}
          onChange={(e) => setDocumentacion(e.target.value)}
          className="w-full p-2 border rounded"
        />

        {/* Subir desde computadora */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="block"
        />

        {/* Añadir desde URL */}
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Pegar URL de imagen"
            className="flex-1 p-2 border rounded"
            id="imgUrlInput"
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById("imgUrlInput") as HTMLInputElement;
              if (input.value) handleAddImageUrl(input.value);
              input.value = "";
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Agregar
          </button>
        </div>

        {/* Vista previa y selección de portada */}
        {imagenes.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imagenes.map((img, idx) => (
              <div
                key={idx}
                className={`border-4 ${
                  portadaIndex === idx ? "border-green-500" : "border-transparent"
                }`}
              >
                <img
                  src={img}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-24 object-cover cursor-pointer"
                  onClick={() => setPortadaIndex(idx)}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Publicando..." : "Publicar Terreno"}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full">
            Cancelar
          </button>
      </form>
    </div>
  );
}
