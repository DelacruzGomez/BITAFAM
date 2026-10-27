import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button"; // Usando tu alias limpio nativo de la app
import { Phone, UserRoundMinusIcon, Bell, Menu, X, Trees, Home } from "lucide-react";


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user, logout } = useAuth();
  
  // Guardamos la ruta actual para saber qué botón iluminar en verde
  const rutaActual = location.pathname;

  const [profileName, setProfileName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [showNotificationAdmin, setShowNotificationAdmin] = useState(false);
  const [showNotificationUser, setShowNotificationUser] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [solicitudesAdmin, setSolicitudesAdmin] = useState<
    {
      id: number;
      user_id: string;
      user_name: string;
      datos_formulario: any;
    }[]
  >([]);
  const [solicitudUser, setSolicitudUser] = useState<
    { estado: string; created_at: string } | null
  >(null);

  const notificationRefAdmin = useRef<HTMLDivElement>(null);
  const notificationRefUser = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            setProfileName("");
            setUserRole("");
          } else {
            setProfileName(data?.name || "");
            setUserRole(data?.role || "");
          }
        });
    } else {
      setProfileName("");
      setUserRole("");
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNotificationAdmin &&
        notificationRefAdmin.current &&
        !notificationRefAdmin.current.contains(event.target as Node)
      ) {
        setShowNotificationAdmin(false);
      }
      if (
        showNotificationUser &&
        notificationRefUser.current &&
        !notificationRefUser.current.contains(event.target as Node)
      ) {
        setShowNotificationUser(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationAdmin, showNotificationUser]);

  useEffect(() => {
    if (userRole === "admin") {
      const fetchSolicitudes = async () => {
        const { data, error } = await supabase
          .from("publicacion_solicitudes")
          .select("id, user_id, user_name, datos_formulario")
          .eq("estado", "pendiente")
          .order("created_at", { ascending: true });
        if (!error && data) {
          setSolicitudesAdmin(data);
        }
      };
      fetchSolicitudes();
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole !== "admin" && user) {
      const fetchSolicitud = async () => {
        const { data, error } = await supabase
          .from("publicacion_solicitudes")
          .select("estado, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          setSolicitudUser(data);
        } else {
          setSolicitudUser(null);
        }
      };
      fetchSolicitud();
    }
  }, [userRole, user]);

  const isAdmin = userRole === "admin";
  const isUser = user && !isAdmin;

    const actualizarEstadoSolicitud = async (
    id: number,
    nuevoEstado: string,
    datosFormulario?: any,
    userId?: string
  ) => {
    // 1. Efecto Espejo (Optimistic Update): Quitamos la solicitud de la lista de inmediato
    setSolicitudesAdmin((prev) => prev.filter((s) => s.id !== id));
    setShowNotificationAdmin(false); // Cierra el modal para mejorar la fluidez

    try {
      if (nuevoEstado === "aceptado" && datosFormulario && userId) {
        const {
          titulo,
          descripcion,
          precio,
          moneda,
          ubicacion,
          imagenes,
          videos,
          area,
          tipo,
          dimensiones,
          topografia,
          acceso,
          zonificacion,
          servicios,
          documentacion,
          habitaciones,
          banos,
          pisos,
        } = datosFormulario;

        const portada = imagenes && imagenes.length > 0 ? imagenes[0] : null;

        // Inserción controlada con manejo de fallos
        const { error: publicarError } = await supabase.from("land_properties").insert({
          user_id: userId,
          titulo: titulo || "Terreno sin título",
          descripcion: descripcion || "",
          precio: precio ? parseFloat(precio) : null,
          moneda: moneda || "PEN",
          ubicacion: ubicacion || "",
          imagen: portada,
          imagenes: imagenes || [],
          videos: videos || [],
          area: area ? parseFloat(area) : null,
          tipo: tipo || "urbano",
          status: "disponible", // Alineado al default de tu base de datos
          dimensiones: dimensiones || "",
          topografia: topografia || "Plano",
          acceso: acceso || "",
          zonificacion: zonificacion || "",
          servicios: servicios || "",
          documentacion: documentacion || "",
          habitaciones: habitaciones ? parseInt(habitaciones, 10) : 0,
          banos: banos ? parseInt(banos, 10) : 0,
          pisos: pisos ? parseInt(pisos, 10) : 0,
        });

        if (publicarError) {
          alert("Error al insertar propiedad en land_properties: " + publicarError.message);
          return;
        }

        // Modificamos el estado en la tabla de solicitudes
        const { error: errorUpdate } = await supabase
          .from("publicacion_solicitudes")
          .update({ estado: "aceptado" })
          .eq("id", id);

        if (errorUpdate) {
          alert("Error al cambiar estado de la solicitud: " + errorUpdate.message);
          return;
        }

        alert("¡Solicitud aprobada y terreno publicado con éxito!");
        
      } else if (nuevoEstado === "rechazado") {
        const { error } = await supabase
          .from("publicacion_solicitudes")
          .update({ estado: "rechazado" })
          .eq("id", id);

        if (error) {
          alert("Error al denegar la solicitud: " + error.message);
          return;
        }
        alert("Solicitud rechazada correctamente.");
      }
    } catch (err: any) {
      alert("Ocurrió un error inesperado: " + err.message);
    }
  };


  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      logout();
      setIsMobileMenuOpen(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
// Leemos la categoría actual de la URL. Si no hay, por defecto es vacío (todos).
const categoriaActual = searchParams.get("tipo") || "";

const seleccionarCategoria = (tipo: string) => {
  if (tipo === "") {
    searchParams.delete("tipo"); // Si elige "Todos", limpiamos la URL
  } else {
    searchParams.set("tipo", tipo);
  }
  setSearchParams(searchParams);
};

return (
  <header className="bg-white shadow-md sticky top-0 z-50 w-full">
    <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
        <img
          src="/bitafamcolor.webp"
          alt="Logo BITAFAM"
          className="h-8 sm:h-10 md:h-12 w-auto object-contain"
        />
      </Link>

        {/* Slogan Comentado para evitar solapamiento visual en el diseño superior
        {!isAdmin && (
          <div className="hidden lg:flex flex-1 justify-center px-4 max-w-xl">
            <span
              className="text-xs xl:text-sm font-semibold tracking-wider text-gray-500 text-center uppercase"
              style={{ 
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
              }}
            >
              "Tu socio confiable en la búsqueda del terreno perfecto"
            </span>
          </div>
        )}
        */}


        {/* Menú de Escritorio (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Notificaciones Admin */}
          {isAdmin && (
            <div className="relative">
              <button
                title="Notificaciones"
                onClick={() => {
                  setShowNotificationAdmin((prev) => !prev);
                  setShowNotificationUser(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {solicitudesAdmin.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {solicitudesAdmin.length}
                  </span>
                )}
              </button>

              {showNotificationAdmin && (
                <div
                  ref={notificationRefAdmin}
                  className="absolute right-0 mt-2 w-80 md:w-[450px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-4"
                >
                  {solicitudesAdmin.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4">No hay solicitudes pendientes</p>
                  ) : (
                    <ul className="space-y-3">
                      {solicitudesAdmin.map((sol) => (
                        <li key={sol.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 flex flex-col space-y-2">
                          <p className="text-xs text-gray-700 font-semibold">Solicitud de: {sol.user_name}</p>
                          <pre className="text-[10px] max-h-24 overflow-auto bg-gray-100 p-2 rounded text-gray-600 whitespace-pre-wrap font-mono">
                            {JSON.stringify(sol.datos_formulario, null, 2)}
                          </pre>
                          <div className="flex gap-2 pt-1 justify-end">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowNotificationAdmin(false); navigate("/publicar", { state: { solicitud: sol.datos_formulario, reviewMode: true, solicitudId: sol.id, userId: sol.user_id, userName: sol.user_name } }); }}>Verificar y Editar</Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => actualizarEstadoSolicitud(sol.id, "aceptado", sol.datos_formulario, sol.user_id)}>Aceptar</Button>
                            <Button size="sm" variant="destructive" className="text-xs" onClick={() => actualizarEstadoSolicitud(sol.id, "rechazado")}>Denegar</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
{/* NUEVOS BOTONES DE CATEGORIZACIÓN CENTRALES */}
<div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
  
  <Button
    variant={rutaActual === "/terrenos" ? "default" : "outline"}
    onClick={() => navigate("/terrenos")}
    className={`h-10 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
      rutaActual === "/terrenos"
        ? "bg-green-600 text-white shadow-sm hover:bg-green-700 border-green-600"
        : "bg-transparent text-gray-500 hover:text-gray-900 border-none shadow-none"
    }`}
  >
    <Trees className="w-4 h-4" />
    <span>Terrenos</span>
  </Button>

  <Button
    variant={rutaActual === "/casas" ? "default" : "outline"}
    onClick={() => navigate("/casas")}
    className={`h-10 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
      rutaActual === "/casas"
        ? "bg-green-600 text-white shadow-sm hover:bg-green-700 border-green-600"
        : "bg-transparent text-gray-500 hover:text-gray-900 border-none shadow-none"
    }`}
  >
    <Home className="w-4 h-4" />
    <span>Casas</span>
  </Button>
</div>

          {/* Notificaciones Usuario */}
          {isUser && (
            <div className="relative">
              <button
                title="Estado Solicitud"
                onClick={() => {
                  setShowNotificationUser((prev) => !prev);
                  setShowNotificationAdmin(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {solicitudUser && (
                  <span
                    className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                      solicitudUser.estado === "pendiente" ? "bg-yellow-500" : "bg-green-600"
                    }`}
                  />
                )}
              </button>

              {showNotificationUser && (
                <div ref={notificationRefUser} className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 text-sm text-gray-700">
                  {!solicitudUser ? (
                    <p className="text-gray-500 text-center py-2">No tienes solicitudes.</p>
                  ) : (
                    <div className="space-y-1">
                      <p>Estado: <strong className={solicitudUser.estado === "aceptado" ? "text-green-600" : solicitudUser.estado === "rechazado" ? "text-red-600" : "text-yellow-600"}>{solicitudUser.estado.toUpperCase()}</strong></p>
                      <p className="text-xs text-gray-400">Enviada: {new Date(solicitudUser.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WhatsApp Contacto */}
          {userRole !== "admin" && (
            <a href="https://wa.me/998026135" target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5 h-10 text-sm">
                <Phone className="h-4 w-4" />
                <span>Contactar BITAFAM</span>
              </Button>
            </a>
          )}

                    {/* Gestión de Sesiones Desktop */}
          {!user ? (
            <Link to="/login">
              <Button className="h-10 text-sm font-semibold">Iniciar sesión</Button>
            </Link>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-gray-50 border px-3 h-10 rounded-lg max-w-[150px] xl:max-w-[200px]">
                <UserRoundMinusIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">{profileName || user.email}</span>
              </div>
              
              {/* ENLACE NUEVO: Mis Favoritos Desktop */}

              
              <Link to="/publicar">
                <Button variant="outline" className="h-10 text-sm font-semibold">Publicar</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout} className="h-10 text-sm font-semibold">Cerrar sesión</Button>
            </>
          )}
        </div>

        {/* Hamburguesa Móvil */}
        <div className="flex md:hidden items-center gap-2">
  {isAdmin && solicitudesAdmin.length > 0 && (
    <button 
      onClick={() => { setIsMobileMenuOpen(true); setShowNotificationAdmin(true); }} 
      className="relative p-2 text-red-600"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
        {solicitudesAdmin.length}
      </span>
    </button>
  )}

  <button
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
    aria-label="Abrir menú"
  >
    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
  </button>
</div>
</div>

{/* Menú Desplegable Móvil */}
{isMobileMenuOpen && (
  <div className="sm:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4 shadow-inner">

        {/* BOTONES DE CATEGORIZACIÓN PARA CELULARES CENTRADOS */}
    <div className="flex flex-col space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 text-center">
        Categorías
      </p>
      
      {/* 🛠️ Se cambió a grid-cols-2 y max-w-xs con mx-auto para centrar todo el bloque */}
      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 max-w-sm mx-auto w-full">
        
        <button
          onClick={() => { navigate("/terrenos"); setIsMobileMenuOpen(false); }}
          className={`py-2.5 text-xs font-bold text-center rounded-lg transition-all duration-200 ${
            rutaActual === "/terrenos" 
              ? "bg-green-600 text-white shadow-sm" 
              : "text-gray-500 active:bg-gray-200 hover:bg-gray-100"
          }`}
        >
          Terrenos
        </button>

        <button
          onClick={() => { navigate("/casas"); setIsMobileMenuOpen(false); }}
          className={`py-2.5 text-xs font-bold text-center rounded-lg transition-all duration-200 ${
            rutaActual === "/casas" 
              ? "bg-green-600 text-white shadow-sm" 
              : "text-gray-500 active:bg-gray-200 hover:bg-gray-100"
          }`}
        >
          Casas
        </button>

      </div>
    </div>


    {/* 🌟 BLOQUE DE USUARIO BIEN ENCAPSULADO Y DISTRIBUIDO */}
    {user && (
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 border rounded-lg">
        <UserRoundMinusIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-semibold text-gray-800 truncate">
          {profileName || user.email}
        </span>
      </div>
    )}

    {/* Contenedor vertical de acciones con espaciado consistente */}
    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
      
      {/* Botón de Contacto por WhatsApp */}
      {userRole !== "admin" && (
        <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="w-full">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11 rounded-xl">
            <Phone className="h-4 w-4 mr-2" />
            Contactar BITAFAM
          </Button>
        </a>
      )}
      {/* Botón de Publicar Propiedad */}
      {user && (
        <Link to="/publicar" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
          <Button variant="outline" className="w-full h-11 font-bold rounded-xl">
            Publicar Propiedad
          </Button>
        </Link>
      )}


            {!user ? (
              <Link to="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full h-11 font-bold">Iniciar sesión</Button>
              </Link>
            ) : (
              <Button variant="destructive" onClick={handleLogout} className="w-full h-11 font-bold">
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

