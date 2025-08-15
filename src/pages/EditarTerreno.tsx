import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function EditarTerreno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Si el terreno viene desde Index.tsx por state
  const terrenoInicial = location.state?.terreno || null;

  const [loading, setLoading] = useState(!terrenoInicial);
  const [titulo, setTitulo] = useState(terrenoInicial?.titulo || "");
  const [descripcion, setDescripcion] = useState(terrenoInicial?.descripcion || "");
  const [precio, setPrecio] = useState(terrenoInicial?.precio?.toString() || "");
  const [ubicacion, setUbicacion] = useState(terrenoInicial?.ubicacion || "");
  const [area, setArea] = useState(terrenoInicial?.area?.toString() || "");
  const [tipo, setTipo] = useState(terrenoInicial?.tipo || "urbano");
  const [status, setStatus] = useState(terrenoInicial?.status || "disponible");

  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenURLs, setImagenURLs] = useState<string[]>(terrenoInicial?.imagenes || []);
  const [portada, setPortada] = useState<string>(terrenoInicial?.portada || "");

  const [dimensiones, setDimensiones] = useState(terrenoInicial?.dimensiones || "");
  const [topografia, setTopografia] = useState(terrenoInicial?.topografia || "");
  const [acceso, setAcceso] = useState(terrenoInicial?.acceso || "");
  const [zonificacion, setZonificacion] = useState(terrenoInicial?.zonificacion || "");
  const [servicios, setServicios] = useState(terrenoInicial?.servicios || "");
  const [documentacion, setDocumentacion] = useState(terrenoInicial?.documentacion || "");

  useEffect(() => {
    if (!terrenoInicial) {
      const fetchData = async () => {
        const { data, error } = await supabase
          .from("land_properties")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          alert("Error al cargar los datos del terreno.");
          navigate("/");
          return;
        }

        setTitulo(data.titulo || "");
        setDescripcion(data.descripcion || "");
        setPrecio(data.precio?.toString() || "");
        setUbicacion(data.ubicacion || "");
        setArea(data.area?.toString() || "");
        setTipo(data.tipo || "urbano");
        setStatus(data.status || "disponible");
        setImagenURLs(data.imagenes || []);
        setPortada(data.portada || "");
        setDimensiones(data.dimensiones || "");
        setTopografia(data.topografia || "");
        setAcceso(data.acceso || "");
        setZonificacion(data.zonificacion || "");
        setServicios(data.servicios || "");
        setDocumentacion(data.documentacion || "");

        setLoading(false);
      };

      fetchData();
    }
  }, [id, navigate, terrenoInicial]);

  const handleRemoveImage = (url: string) => {
    if (confirm("¿Seguro que quieres eliminar esta imagen?")) {
      const updated = imagenURLs.filter((img) => img !== url);
      setImagenURLs(updated);
      if (portada === url) {
        setPortada(updated.length > 0 ? updated[0] : "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let urls: string[] = [...imagenURLs];

    for (const image of imagenes) {
      const fileName = `terrenos/${Date.now()}_${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("land-images")
        .upload(fileName, image);

      if (uploadError) {
        console.error(uploadError);
        alert("Error al subir una imagen");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("land-images")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        urls.push(urlData.publicUrl);
      }
    }

    // Asegurar portada válida
    let portadaFinal = portada;
    if (!portadaFinal || !urls.includes(portadaFinal)) {
      portadaFinal = urls.length > 0 ? urls[0] : "";
    }

    const { error: updateError } = await supabase
      .from("land_properties")
      .update({
        titulo,
        descripcion,
        precio: parseFloat(precio),
        ubicacion,
        imagenes: urls,
        portada: portadaFinal,
        area: parseFloat(area),
        tipo,
        dimensiones,
        topografia,
        acceso,
        zonificacion,
        servicios,
        documentacion,
        status
      })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      alert("Error al actualizar terreno");
      setLoading(false);
      return;
    }

    alert("Terreno actualizado con éxito");
    navigate("/");
  };

  if (loading) {
    return <p className="text-center mt-10">Cargando terreno...</p>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Editar Terreno</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos */}
        <input type="text" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-2 border rounded" required />
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="text" placeholder="Área en m²" value={area} onChange={(e) => setArea(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="text" placeholder="Ubicación" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="w-full p-2 border rounded" required />

        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-2 border rounded">
          <option value="residencial">Residencial</option>
          <option value="comercial">Comercial</option>
          <option value="industrial">Industrial</option>
          <option value="campestre">Campestre</option>
          <option value="rural">Rural</option>
          <option value="urbano">Urbano</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded">
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="reservado">Reservado</option>
        </select>

        <input type="text" placeholder="Dimensiones" value={dimensiones} onChange={(e) => setDimensiones(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Topografía" value={topografia} onChange={(e) => setTopografia(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Acceso" value={acceso} onChange={(e) => setAcceso(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Zonificación" value={zonificacion} onChange={(e) => setZonificacion(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Servicios disponibles" value={servicios} onChange={(e) => setServicios(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Documentación" value={documentacion} onChange={(e) => setDocumentacion(e.target.value)} className="w-full p-2 border rounded" />

        {/* Imágenes actuales */}
        <div className="grid grid-cols-3 gap-2">
          {imagenURLs.map((url, idx) => (
            <div key={idx} className="relative border rounded overflow-hidden">
              <img src={url} alt={`Imagen ${idx + 1}`} className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-700"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1">
                <input
                  type="radio"
                  name="portada"
                  checked={portada === url}
                  onChange={() => setPortada(url)}
                  className="mr-1"
                />
                <span className="text-xs bg-white px-1 rounded">Portada</span>
              </div>
            </div>
          ))}
        </div>

        {/* Nuevas imágenes */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImagenes(Array.from(e.target.files || []))}
          className="block mt-2"
        />

        <div className="flex space-x-2">
          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full">
            {loading ? "Actualizando..." : "Guardar Cambios"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}