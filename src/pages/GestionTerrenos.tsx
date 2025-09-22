import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface Terreno {
  id: number;
  user_id: string;
  titulo: string;
  descripcion: string;
  precio?: number | null;
  moneda?: string;
  ubicacion: string;
  imagen?: string;
  portada?: string;
  area?: number;
  tipo?: string;
  status: "disponible" | "vendido" | "reservado";
  videos?: string[];
}

export default function GestionTerrenos() {
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
      fetchTerrenos();
    }
  }, [currentUserId, isAdmin]);

  const getCurrentUser = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    setCurrentUserId(userId);

    if (userId) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      if (!error && userData?.role === "admin") {
        setIsAdmin(true);
      }
    }
  };

  const fetchTerrenos = async () => {
    setLoading(true);
    let query = supabase
      .from("land_properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin && currentUserId) {
      query = query.eq("user_id", currentUserId);
    }

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      alert("Error al cargar terrenos.");
      console.error(error);
    } else {
      setTerrenos(data || []);
    }
  };

  const handleEdit = (terreno: Terreno) => {
    if (!isAdmin && currentUserId !== terreno.user_id) {
      alert("Solo puedes editar tus propios terrenos.");
      return;
    }
    navigate(`/editar/${terreno.id}`, { state: { terreno } });
  };

  const handleDelete = async (id: number, userId: string) => {
    if (!isAdmin && currentUserId !== userId) {
      alert("Solo puedes eliminar tus propios terrenos.");
      return;
    }

    if (!confirm("¿Seguro que deseas eliminar este terreno? Esta acción no se puede deshacer.")) return;

    setLoading(true);
    let query = supabase.from("land_properties").delete().eq("id", id);
    if (!isAdmin) query = query.eq("user_id", userId);
    const { error } = await query;
    setLoading(false);

    if (error) {
      alert("Error al eliminar");
      console.error(error);
    } else {
      alert("Terreno eliminado");
      fetchTerrenos();
    }
  };

  const toggleStatus = async (terreno: Terreno) => {
    if (!isAdmin && currentUserId !== terreno.user_id) {
      alert("Solo puedes cambiar el estado de tus propios terrenos.");
      return;
    }

    const newStatus = terreno.status === "disponible" ? "vendido" : "disponible";

    setLoading(true);
    let query = supabase
      .from("land_properties")
      .update({ status: newStatus })
      .eq("id", terreno.id);
    if (!isAdmin) query = query.eq("user_id", currentUserId);
    const { error } = await query;
    setLoading(false);

    if (error) {
      alert("Error al cambiar estado.");
      console.error(error);
    } else {
      fetchTerrenos();
    }
  };

  if (loading && terrenos.length === 0) {
    return <div className="p-4 max-w-7xl mx-auto">Cargando terrenos...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      {/* Portada con imagen y botón volver al costado */}
      <header
        className="relative w-full h-48 rounded-md overflow-hidden flex items-center justify-between px-6"
        style={{
          backgroundImage: "url('/fondo.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-white text-4xl font-bold drop-shadow-md">Gestión de Terrenos</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded drop-shadow-lg transition"
          aria-label="Volver atrás"
        >
          Volver
        </button>
      </header>

      {terrenos.length === 0 && !loading ? (
        <p>No hay terrenos para mostrar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terrenos.map((terreno) => (
            <div key={terreno.id} className="border rounded overflow-hidden shadow bg-white flex flex-col">
              <img
                src={terreno.portada || terreno.imagen || "/placeholder.png"}
                alt={terreno.titulo}
                className="h-48 w-full object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg">{terreno.titulo}</h3>
                <p className="text-sm text-gray-600 mb-1">Ubicación: {terreno.ubicacion}</p>
                <p className="text-gray-700 mb-2 flex-grow">{terreno.descripcion}</p>
                <p
                  className={`font-bold text-lg mb-2 ${
                    terreno.status === "disponible" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {(terreno.moneda === "USD" ? "US$ " : "S/. ") +
                    (terreno.precio ?? 0).toLocaleString(
                      terreno.moneda === "USD" ? "en-US" : "es-PE"
                    )}{" "}
                  — {terreno.status.toUpperCase()}
                </p>

                {(isAdmin || currentUserId === terreno.user_id) && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={() => handleEdit(terreno)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex-grow"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleStatus(terreno)}
                      className={`px-3 py-1 rounded flex-grow text-white ${
                        terreno.status === "disponible"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      disabled={loading}
                    >
                      {terreno.status === "disponible" ? "Marcar como Vendido" : "Marcar como Disponible"}
                    </button>
                    <button
                      onClick={() => handleDelete(terreno.id, terreno.user_id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex-grow"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                {/* Botón Ver Detalles accesible para todos */}
                <button
                  onClick={() => navigate(`/terreno/${terreno.id}`)}
                  className="mt-3 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded w-full"
                  aria-label={`Ver detalles del terreno ${terreno.titulo}`}
                  disabled={loading}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
