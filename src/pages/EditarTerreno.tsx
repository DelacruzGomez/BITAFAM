import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function EditarTerreno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const terrenoInicial = location.state?.terreno || null;

  const [loading, setLoading] = useState(!terrenoInicial);
  const [titulo, setTitulo] = useState(terrenoInicial?.titulo || "");
  const [descripcion, setDescripcion] = useState(terrenoInicial?.descripcion || "");
  const [precio, setPrecio] = useState(terrenoInicial?.precio?.toString() || "");
  const [moneda, setMoneda] = useState(terrenoInicial?.moneda || "PEN");
  const [ubicacion, setUbicacion] = useState(terrenoInicial?.ubicacion || "");
  const [area, setArea] = useState(terrenoInicial?.area?.toString() || "");
  const [tipo, setTipo] = useState(terrenoInicial?.tipo || "urbano");
  const [status, setStatus] = useState(terrenoInicial?.status || "disponible");
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenURLs, setImagenURLs] = useState<string[]>(terrenoInicial?.imagenes || []);
  const [portada, setPortada] = useState<string>(terrenoInicial?.portada || "");
  const [videos, setVideos] = useState<File[]>([]);
  const [videoURLs, setVideoURLs] = useState<string[]>(terrenoInicial?.videos || []);
  const [dimensiones, setDimensiones] = useState(terrenoInicial?.dimensiones || "");
  const [topografia, setTopografia] = useState(terrenoInicial?.topografia || "");
  const [acceso, setAcceso] = useState(terrenoInicial?.acceso || "");
  const [zonificacion, setZonificacion] = useState(terrenoInicial?.zonificacion || "");
  const [servicios, setServicios] = useState(terrenoInicial?.servicios || "");
  const [documentacion, setDocumentacion] = useState(terrenoInicial?.documentacion || "");

  const [uploadProgressImages, setUploadProgressImages] = useState<number>(0);
  const [uploadProgressVideos, setUploadProgressVideos] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    setPrecio(rawValue);
  };

  useEffect(() => {
    if (terrenoInicial) {
      setMoneda(terrenoInicial.moneda || "PEN");
      setPrecio(terrenoInicial.precio?.toString() || "");
      setVideos([]);
      setVideoURLs(terrenoInicial.videos || []);
      setLoading(false);
      return;
    }

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
      setMoneda(data.moneda || "PEN");
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
      setVideos([]);
      setVideoURLs(data.videos || []);
      setLoading(false);
    };

    fetchData();
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

  const handleRemoveVideo = (url: string) => {
    if (confirm("¿Seguro que quieres eliminar este video?")) {
      const updated = videoURLs.filter((vid) => vid !== url);
      setVideoURLs(updated);
      if (portada === url) {
        // Si la portada es ese video, cambiarla a alguna imagen o video disponible
        let newPortada = imagenURLs.length > 0 ? imagenURLs[0] : "";
        if (!newPortada && videoURLs.length > 0) newPortada = videoURLs[0];
        setPortada(newPortada);
      }
    }
  };

  const handleMonedaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMoneda(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newImages: File[] = [];
    const newVideos: File[] = [];

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        newImages.push(file);
      } else if (file.type === "video/mp4") {
        newVideos.push(file);
      } else {
        alert(`Archivo no soportado: ${file.name}. Sólo imágenes y videos MP4.`);
      }
    });

    setImagenes((prev) => [...prev, ...newImages]);
    setVideos((prev) => [...prev, ...newVideos]);

    e.target.value = "";
  };

  async function uploadFileWithProgress(
    bucket: string,
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string | null> {
    return new Promise(async (resolve) => {
      const timestamp = Date.now();
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
      const fileName = `terrenos/${timestamp}_${cleanName}`;

      const upload = supabase.storage.from(bucket).upload(fileName, file, {
        upsert: true,
      });

      const { data, error } = await upload;
      if (error) {
        alert(`Error al subir archivo ${file.name}: ${error.message}`);
        resolve(null);
        return;
      }
      onProgress(100);
      resolve(data?.path ?? null);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let urls: string[] = [...imagenURLs];
    for (let i = 0; i < imagenes.length; i++) {
      setUploadProgressImages(Math.round((i / imagenes.length) * 100));
      const path = await uploadFileWithProgress("land-images", imagenes[i], () => {});
      if (path) {
        const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
        if (urlData?.publicUrl) urls.push(urlData.publicUrl);
      } else {
        setLoading(false);
        return;
      }
    }
    setUploadProgressImages(100);

    let videoUrls: string[] = [...videoURLs];
    for (let i = 0; i < videos.length; i++) {
      setUploadProgressVideos(Math.round((i / videos.length) * 100));
      const path = await uploadFileWithProgress("land-videos", videos[i], () => {});
      if (path) {
        const { data: urlData } = supabase.storage.from("land-videos").getPublicUrl(path);
        if (urlData?.publicUrl) videoUrls.push(urlData.publicUrl);
      } else {
        setLoading(false);
        return;
      }
    }
    setUploadProgressVideos(100);

    let portadaFinal = portada;
    // Si la portada seleccionada no está en imágenes ni videos nuevos, pon primera de cada lista
    if (!portadaFinal || (!urls.includes(portadaFinal) && !videoUrls.includes(portadaFinal))) {
      portadaFinal = urls.length > 0 ? urls[0] : videoUrls.length > 0 ? videoUrls[0] : "";
    }

    const { error: updateError } = await supabase
      .from("land_properties")
      .update({
        titulo,
        descripcion,
        precio: parseFloat(precio),
        moneda,
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
        status,
        videos: videoUrls,
      })
      .eq("id", id);

    if (updateError) {
      alert("Error al actualizar terreno: " + updateError.message);
      setLoading(false);
      return;
    }

    alert("Terreno actualizado con éxito");
    setLoading(false);
    navigate("/");
  };

  if (loading) {
    return <p className="text-center mt-10">Cargando terreno...</p>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Editar Terreno</h2>
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
          type="text"
          placeholder="Precio"
          value={precio}
          onChange={handlePrecioChange}
          className="w-full p-2 border rounded"
          required
          inputMode="decimal"
        />
        <select
          value={moneda}
          onChange={handleMonedaChange}
          className="w-full p-2 border rounded"
        >
          <option value="PEN">Soles Peruanos (S/.)</option>
          <option value="USD">Dólares Americanos (US$)</option>
        </select>
        <input
          type="text"
          placeholder="Área en m²"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Ubicación + link opcional"
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="reservado">Reservado</option>
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

        {/* Imágenes actuales y selector portada */}
        <div className="grid grid-cols-3 gap-2">
          {imagenURLs.map((url, idx) => (
            <div key={idx} className="relative border rounded overflow-hidden">
              <img
                src={url}
                alt={`Imagen ${idx + 1}`}
                className="h-24 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-700"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1 flex items-center">
                <input
                  type="radio"
                  name="portada"
                  checked={portada === url}
                  onChange={() => setPortada(url)}
                  className="mr-1"
                />
                <span className="text-xs bg-white px-1 rounded cursor-pointer">Portada</span>
              </div>
            </div>
          ))}
        </div>
        {/* Videos actuales y selector portada */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {videoURLs.map((url, idx) => (
            <div key={idx} className="relative border rounded overflow-hidden">
              <video
                src={url}
                controls
                className="h-24 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveVideo(url)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-700"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1 flex items-center">
                <input
                  type="radio"
                  name="portada"
                  checked={portada === url}
                  onChange={() => setPortada(url)}
                  className="mr-1"
                />
                <span className="text-xs bg-white px-1 rounded cursor-pointer">Portada</span>
              </div>
            </div>
          ))}
        </div>

        {/* Botón para elegir archivos */}
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full"
        >
          Elegir imágenes o videos (MP4)
        </button>
        <input
          type="file"
          accept="image/*,video/mp4"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex space-x-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Actualizando..." : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
