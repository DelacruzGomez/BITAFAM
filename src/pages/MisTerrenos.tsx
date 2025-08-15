import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Terreno {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  image_url: string;
  status: string;
  created_at: string;
}

export default function MisTerrenos() {
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerrenos = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar terrenos", error);
      } else {
        setTerrenos(data || []);
      }

      setLoading(false);
    };

    fetchTerrenos();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-green-600" />
        <span className="ml-2 text-gray-500">Cargando tus terrenos...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Mis Terrenos Publicados</h1>
      {terrenos.length === 0 ? (
        <p>No has publicado terrenos aún.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {terrenos.map((terreno) => (
            <li key={terreno.id} className="border p-4 rounded shadow-sm">
              <img
                src={terreno.image_url}
                alt={terreno.title}
                className="w-full h-40 object-cover rounded mb-2"
              />
              <h2 className="font-semibold text-lg">{terreno.title}</h2>
              <p className="text-sm text-gray-600">{terreno.location}</p>
              <p className="text-sm">{terreno.description}</p>
              <p className="text-green-700 font-bold mt-2">S/. {terreno.price}</p>
              <p className="text-xs text-gray-400 mt-1">Estado: {terreno.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
