import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "./ui/button";
import { Phone, UserRoundMinusIcon, Bell } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [profileName, setProfileName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [showNotificationAdmin, setShowNotificationAdmin] = useState(false);
  const [showNotificationUser, setShowNotificationUser] = useState(false);
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
  const navigate = useNavigate();

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
    if (nuevoEstado === "aceptado" && datosFormulario && userId) {
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
      } = datosFormulario;

      const portada = imagenes && imagenes.length > 0 ? imagenes[0] : null;

      const { error: publicarError } = await supabase.from("land_properties").insert({
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
      });

      if (publicarError) {
        alert("Error al publicar terreno: " + publicarError.message);
        return;
      }

      const { error: errorUpdate } = await supabase
        .from("publicacion_solicitudes")
        .update({ estado: "aceptado" })
        .eq("id", id);
      if (errorUpdate) {
        alert("Error al actualizar estado de solicitud: " + errorUpdate.message);
        return;
      }

      alert("Solicitud aprobada y terreno publicado.");
    } else if (nuevoEstado === "rechazado") {
      const { error } = await supabase
        .from("publicacion_solicitudes")
        .update({ estado: "rechazado" })
        .eq("id", id);
      if (error) {
        alert("Error al actualizar estado: " + error.message);
        return;
      }
      alert("Solicitud denegada.");
    }
    setSolicitudesAdmin((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) logout();
  };

  return (
    <header className="bg-white shadow-md relative">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/bitafamcolor.png" alt="Logo BITAFAM" className="h-12 w-auto object-contain" />
        </Link>

        {!isAdmin && (
          <div className="hidden md:flex flex-1 justify-center">
            <span className="text-lg font-semibold text-black-700">
              Tu socio confiable en la búsqueda del terreno perfecto
            </span>
          </div>
        )}

        <nav className="flex items-center gap-4 relative">
          {isAdmin && (
            <>
              <button
                title="Notificaciones"
                onClick={() => setShowNotificationAdmin((prev) => !prev)}
                className="relative"
              >
                <Bell className="h-6 w-6 text-gray-700 hover:text-gray-900" />
                {solicitudesAdmin.length > 0 && (
                  <span className="absolute top-0 right-0 rounded-full bg-red-600 text-white text-xs px-1.5">
                    {solicitudesAdmin.length}
                  </span>
                )}
              </button>

              {showNotificationAdmin && (
                <div
                  ref={notificationRefAdmin}
                  className="absolute top-full right-0 mt-2 w-[480px] bg-white border border-gray-300 rounded p-4 shadow-lg z-50 overflow-auto max-h-96"
                  style={{ right: "16px" }}
                >
                  {solicitudesAdmin.length === 0 ? (
                    <p className="text-center text-gray-500">No hay solicitudes pendientes</p>
                  ) : (
                    <ul className="space-y-3">
                      {solicitudesAdmin.map((sol) => (
                        <li key={sol.id} className="border rounded p-2 flex flex-col space-y-2">
                          <p><strong>Solicitud de:</strong> {sol.user_name}</p>
                          <pre className="whitespace-pre-wrap max-h-40 overflow-auto bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(sol.datos_formulario, null, 2)}
                          </pre>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate("/publicar", {
                                  state: {
                                    solicitud: sol.datos_formulario,
                                    reviewMode: true,
                                    solicitudId: sol.id,
                                    userId: sol.user_id,
                                    userName: sol.user_name,
                                  },
                                })
                              }
                            >
                              Ver publicación
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                actualizarEstadoSolicitud(sol.id, "aceptado", sol.datos_formulario, sol.user_id)
                              }
                            >
                              Aceptar y Publicar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => actualizarEstadoSolicitud(sol.id, "rechazado")}
                            >
                              Denegar
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          {isUser && (
            <>
              <button
                title="Estado Solicitud"
                onClick={() => setShowNotificationUser((prev) => !prev)}
                className="relative"
              >
                <Bell className="h-6 w-6 text-gray-700 hover:text-gray-900" />
                {solicitudUser && solicitudUser.estado === "pendiente" && (
                  <span className="absolute top-0 right-0 rounded-full bg-yellow-500 text-white text-xs px-1.5">!</span>
                )}
                {(solicitudUser && (solicitudUser.estado === "aceptado" || solicitudUser.estado === "rechazado")) && (
                  <span className="absolute top-0 right-0 rounded-full bg-green-600 text-white text-xs px-1.5">✓</span>
                )}
              </button>

              {showNotificationUser && (
                <div
                  ref={notificationRefUser}
                  className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-300 rounded p-4 shadow-lg z-50"
                  style={{ right: "16px" }}
                >
                  {!solicitudUser ? (
                    <p>No tienes solicitudes de publicación.</p>
                  ) : (
                    <>
                      <p>
                        Estado de tu solicitud:{" "}
                        <strong
                          className={
                            solicitudUser.estado === "aceptado"
                              ? "text-green-600"
                              : solicitudUser.estado === "rechazado"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {solicitudUser.estado.charAt(0).toUpperCase() + solicitudUser.estado.slice(1)}
                        </strong>
                      </p>
                      <p className="text-sm text-gray-500">
                        Enviada el: {new Date(solicitudUser.created_at).toLocaleDateString()}
                      </p>
                      {solicitudUser.estado === "rechazado" && (
                        <p className="mt-2 text-red-700 font-semibold">Tu solicitud fue denegada.</p>
                      )}
                      {solicitudUser.estado === "aceptado" && (
                        <p className="mt-2 text-green-700 font-semibold">Tu solicitud fue aprobada y publicada.</p>
                      )}
                      {solicitudUser.estado === "pendiente" && (
                        <p className="mt-2 text-yellow-700 font-semibold">Tu solicitud está pendiente de aprobación.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mostrar botón "Contactar BITAFAM" SOLO para usuario (no admin) */}
         
            {userRole !== "admin" && (
              <a href="https://wa.me/998026135" target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contactar BITAFAM
                </Button>
              </a>
            )}

          {!user && (
            <Link to="/login">
              <Button className="text-sm font-medium">Iniciar sesión</Button>
            </Link>
          )}

          {user && (
            <Button variant="outline" className="flex items-center space-x-2">
              <UserRoundMinusIcon className="h-4 w-4" />
              <span className="hidden md:inline">{profileName || user.email}</span>
            </Button>
          )}

          {user && (
            <Link to="/publicar">
              <Button variant="outline" className="text-sm font-medium">
                Publicar
              </Button>
            </Link>
          )}

          {user && (
            <Button variant="destructive" onClick={handleLogout} className="text-sm">
              Cerrar sesión
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
