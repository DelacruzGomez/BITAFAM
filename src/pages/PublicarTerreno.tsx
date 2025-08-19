// src/pages/PublicarTerreno.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function PublicarTerreno() {
  const navigate = useNavigate();
  const location = useLocation();

  // Datos de la solicitud y control de modo revisión y IDs para aprobación
  const solicitud = location.state?.solicitud || null;
  const reviewMode = location.state?.reviewMode || false;
  const solicitudId = location.state?.solicitudId || null;
  const userId = location.state?.userId || null;

  // Formularios states, precargados con datos de la solicitud (si existe)
  const [titulo, setTitulo] = useState(solicitud?.titulo || "");
  const [descripcion, setDescripcion] = useState(solicitud?.descripcion || "");
  const [precio, setPrecio] = useState(solicitud?.precio?.toString() || "");
  const [moneda, setMoneda] = useState(solicitud?.moneda || "PEN");
  const [ubicacion, setUbicacion] = useState(solicitud?.ubicacion || "");
  const [area, setArea] = useState(solicitud?.area?.toString() || "");
  const [tipo, setTipo] = useState(solicitud?.tipo || "urbano");
  const [imagenes, setImagenes] = useState<string[]>(solicitud?.imagenes || []);
  const [portadaIndex, setPortadaIndex] = useState(0);
  const [dimensiones, setDimensiones] = useState(solicitud?.dimensiones || "");
  const [topografia, setTopografia] = useState(solicitud?.topografia || "");
  const [acceso, setAcceso] = useState(solicitud?.acceso || "");
  const [zonificacion, setZonificacion] = useState(solicitud?.zonificacion || "");
  const [servicios, setServicios] = useState(solicitud?.servicios || "");
  const [documentacion, setDocumentacion] = useState(solicitud?.documentacion || "");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [solicitudUserEstado, setSolicitudUserEstado] = useState<string | null>(null);
  const [solicitudUserCreatedAt, setSolicitudUserCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setIsAdmin(false);
        return;
      }
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (userDataError || !userData) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(userData.role === "admin");
      if (!reviewMode && userData.role !== "admin") {
        const { data: solicitudData, error: solicitudError } = await supabase
          .from("publicacion_solicitudes")
          .select("estado, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!solicitudError && solicitudData) {
          setSolicitudUserEstado(solicitudData.estado);
          setSolicitudUserCreatedAt(solicitudData.created_at);
        } else {
          setSolicitudUserEstado(null);
          setSolicitudUserCreatedAt(null);
        }
      }
    };
    checkUserRole();
  }, [reviewMode]);

  const disableInputs = reviewMode && !isAdmin;

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    setPrecio(rawValue);
  };

  const formatPrecio = (val: string) => {
    const numberValue = Number(val);
    if (isNaN(numberValue) || val === "") return "";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
  };

  const handleMonedaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMoneda(e.target.value);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const fileName = `terrenos/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("land-images")
        .upload(fileName, file);
      if (uploadError) {
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

  const handleSolicitarPublicacion = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      alert("Debes iniciar sesión para solicitar publicación.");
      return;
    }
    const user = authData.user;

    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    if (userDataError || !userData) {
      alert("Su cuenta no está registrada correctamente.");
      return;
    }

    const formularioDatos = {
      titulo,
      descripcion,
      precio: Number(precio),
      moneda,
      ubicacion,
      imagenes,
      area: Number(area),
      tipo,
      dimensiones,
      topografia,
      acceso,
      zonificacion,
      servicios,
      documentacion,
    };

    const insertSolicitudPayload = {
      user_id: user.id,
      user_name: userData.name,
      estado: "pendiente",
      datos_formulario: formularioDatos,
      created_at: new Date().toISOString(),
    };
    console.log("[PublicarTerreno] formData -> publicacion_solicitudes.insert", insertSolicitudPayload);

    const { error: solicitudError } = await supabase
      .from("publicacion_solicitudes")
      .insert(insertSolicitudPayload);

    if (solicitudError) {
      alert("Error al enviar solicitud: " + solicitudError.message);
      return;
    }

    alert("Solicitud enviada. Espera la aprobación del administrador.");
    setSolicitudUserEstado("pendiente");
    setSolicitudUserCreatedAt(insertSolicitudPayload.created_at);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewMode) return;

    // Permitir que el usuario haga nueva solicitud aún si ya fue aprobado antes
    if (!isAdmin && solicitudUserEstado !== "aceptado") {
      return handleSolicitarPublicacion();
    }

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

    const insertLandPayload = {
      user_id: user.id,
      titulo,
      descripcion,
      precio: parseFloat(precio),
      moneda,
      ubicacion,
      imagen: portada,
      imagenes,
      area: parseFloat(area),
      tipo,
      status: "publicado",
      dimensiones,
      topografia,
      acceso,
      zonificacion,
      servicios,
      documentacion,
    };
    console.log("[PublicarTerreno] formData -> land_properties.insert (handleSubmit)", insertLandPayload);

    const { error: insertError } = await supabase
      .from("land_properties")
      .insert(insertLandPayload);

    if (insertError) {
      alert("Error al publicar terreno: " + insertError.message);
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      await supabase
        .from("publicacion_solicitudes")
        .update({ estado: "usado" })
        .eq("user_id", user.id)
        .eq("estado", "aceptado");

      setSolicitudUserEstado("usado");
    }

    alert("Terreno publicado con éxito.");
    setLoading(false);
    navigate("/");
  };

  const handleAceptarYPublicar = async () => {
    if (!solicitudId || !userId || !solicitud) {
      alert("Datos incompletos para aprobar.");
      return;
    }
    setLoading(true);

    const {
      titulo,
      descripcion,
      precio,
      moneda,
      ubicacion,
      imagenes,
      area,
      tipo,
      dimensiones,
      topografia,
      acceso,
      zonificacion,
      servicios,
      documentacion,
    } = solicitud;

    const portada = imagenes && imagenes.length > 0 ? imagenes[0] : null;

    const insertLandFromSolicitudPayload = {
      user_id: userId,
      titulo,
      descripcion,
      precio,
      moneda,
      ubicacion,
      imagen: portada,
      imagenes,
      area,
      tipo,
      status: "publicado",
      dimensiones,
      topografia,
      acceso,
      zonificacion,
      servicios,
      documentacion,
    };
    console.log(
      "[PublicarTerreno] formData -> land_properties.insert (handleAceptarYPublicar)",
      insertLandFromSolicitudPayload
    );

    const { error: publicarError } = await supabase
      .from("land_properties")
      .insert(insertLandFromSolicitudPayload);

    if (publicarError) {
      alert("Error al publicar terreno: " + publicarError.message);
      setLoading(false);
      return;
    }

    const updateAceptarPayload = { estado: "aceptado" };
    const updateAceptarWhere = { id: solicitudId };
    console.log("[PublicarTerreno] update -> publicacion_solicitudes.update (aceptar)", {
      set: updateAceptarPayload,
      where: updateAceptarWhere,
    });

    const { error: errorUpdate } = await supabase
      .from("publicacion_solicitudes")
      .update(updateAceptarPayload)
      .eq("id", solicitudId);

    if (errorUpdate) {
      alert("Error al actualizar estado de solicitud: " + errorUpdate.message);
      setLoading(false);
      return;
    }

    alert("Solicitud aprobada y terreno publicado exitosamente.");
    setLoading(false);
    navigate("/");
  };

  const handleDenegarSolicitud = async () => {
    if (!solicitudId) {
      alert("ID de solicitud inválido.");
      return;
    }
    setLoading(true);

    const updateRechazarPayload = { estado: "rechazado" };
    const updateRechazarWhere = { id: solicitudId };
    console.log("[PublicarTerreno] update -> publicacion_solicitudes.update (rechazar)", {
      set: updateRechazarPayload,
      where: updateRechazarWhere,
    });

    const { error } = await supabase
      .from("publicacion_solicitudes")
      .update(updateRechazarPayload)
      .eq("id", solicitudId);

    if (error) {
      alert("Error al denegar solicitud: " + error.message);
      setLoading(false);
      return;
    }
    alert("Solicitud denegada.");
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {reviewMode
          ? `Revisión de publicación de ${location.state?.userName || ""}`
          : isAdmin
          ? "Publicar Terreno"
          : "Publicar Terreno (Usuario)"}
      </h2>

      {reviewMode && isAdmin && (
        <p className="mb-4 text-indigo-700 font-semibold">
          Revisando solicitud enviada por el usuario. Puedes aprobar y publicar o denegar.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={disableInputs}
        />
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder={`Precio (${moneda === "PEN" ? "S/." : "US$"})`}
          value={precio}
          onChange={handlePrecioChange}
          className="w-full p-2 border rounded"
          required
          inputMode="decimal"
          disabled={disableInputs}
        />
        {precio && <div className="text-gray-500 mb-2">Precio formateado: {formatPrecio(precio)}</div>}
        <select
          value={moneda}
          onChange={handleMonedaChange}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        >
          <option value="PEN">Soles Peruanos (S/.)</option>
          <option value="USD">Dólares Americanos (US$)</option>
        </select>
        <input
          type="text"
          placeholder="Área en m² (ej: 120)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={disableInputs}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
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
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Topografía"
          value={topografia}
          onChange={(e) => setTopografia(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Acceso"
          value={acceso}
          onChange={(e) => setAcceso(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Zonificación"
          value={zonificacion}
          onChange={(e) => setZonificacion(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Servicios disponibles"
          value={servicios}
          onChange={(e) => setServicios(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        />
        <input
          type="text"
          placeholder="Documentación"
          value={documentacion}
          onChange={(e) => setDocumentacion(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={disableInputs}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="block"
          disabled={disableInputs}
        />
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Pegar URL de imagen"
            className="flex-1 p-2 border rounded"
            id="imgUrlInput"
            disabled={disableInputs}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById("imgUrlInput") as HTMLInputElement;
              if (input.value) handleAddImageUrl(input.value);
              input.value = "";
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={disableInputs}
          >
            Agregar
          </button>
        </div>
        {imagenes.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imagenes.map((img, idx) => (
              <div
                key={idx}
                className={`border-4 ${portadaIndex === idx ? "border-green-500" : "border-transparent"}`}
              >
                <img
                  src={img}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-24 object-cover cursor-pointer"
                  onClick={() => {
                    if (!disableInputs) setPortadaIndex(idx);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {!reviewMode && solicitudUserEstado === "aceptado" && (
          <>
            <p className="text-green-600 font-semibold text-center mb-2">
              Estado de tu solicitud: <strong>Aceptado</strong>
            </p>
            {solicitudUserCreatedAt && (
              <p className="text-center mb-4">
                Enviada el: {new Date(solicitudUserCreatedAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-green-700 font-semibold text-center mb-4">
              Tu solicitud fue aprobada y publicada.
            </p>
            {/* Mostrar botón para que pueda solicitar nueva publicación */}
            <Button
              type="button"
              onClick={() => {
                // Al pulsar limpia el estado para enviar una nueva solicitud
                setSolicitudUserEstado(null);
                // Limpia formulario para nueva publicación
                setTitulo("");
                setDescripcion("");
                setPrecio("");
                setMoneda("PEN");
                setUbicacion("");
                setArea("");
                setTipo("urbano");
                setImagenes([]);
                setDimensiones("");
                setTopografia("");
                setAcceso("");
                setZonificacion("");
                setServicios("");
                setDocumentacion("");
                setPortadaIndex(0);
              }}
              className="w-full"
            >
              Solicitar nueva publicación
            </Button>
          </>
        )}

        {!reviewMode && solicitudUserEstado !== "aceptado" && (
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? isAdmin
                ? "Publicando..."
                : "Enviando solicitud..."
              : isAdmin || solicitudUserEstado === "aceptado"
              ? "Publicar"
              : "Solicitar publicación"}
          </Button>
        )}

        {reviewMode && isAdmin && (
          <div className="flex space-x-4">
            <Button
              className="bg-green-600 hover:bg-green-700 w-full"
              onClick={handleAceptarYPublicar}
              disabled={loading}
            >
              Aceptar y Publicar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 w-full"
              onClick={handleDenegarSolicitud}
              disabled={loading}
            >
              Denegar
            </Button>
          </div>
        )}

        <Button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white mt-3"
        >
          Cancelar
        </Button>
      </form>
    </div>
  );
}
