// src/pages/GestionTerrenos.tsx
import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Terreno {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image_url: string;
  created_at: string;
  status: "disponible" | "vendido";
}

export default function GestionTerrenos() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchTerrenos();
  }, []);

  // Obtener usuario actual
  const getCurrentUser = async () => {
    const { data: authData } = await supabase.auth.getUser();
    setCurrentUserId(authData?.user?.id || null);
  };

  // Cargar terrenos
  const fetchTerrenos = async () => {
    const { data, error } = await supabase
      .from("land_properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error al cargar terrenos. Inténtalo nuevamente.");
      console.error("Error al cargar terrenos:", error.message);
    } else {
      setTerrenos(data || []);
    }
  };

  // Manejo imagen preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  // Guardar nuevo terreno o actualizar existente
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!currentUserId) {
      alert("Debes iniciar sesión para publicar o editar un terreno.");
      setLoading(false);
      return;
    }

    if (!title || !description || !price || !location) {
      alert("Completa todos los campos.");
      setLoading(false);
      return;
    }

    let imageUrl = "";

    // Si se sube una nueva imagen
    if (image) {
      const fileName = `terrenos/${Date.now()}_${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("land-images")
        .upload(fileName, image, { upsert: true });

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError.message);
        alert("Error al subir la imagen. Verifica el formato o tamaño.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("land-images")
        .getPublicUrl(fileName);

      imageUrl = urlData?.publicUrl || "";
    }

    if (editingId) {
      // Actualizar terreno
      const updates: any = {
        title,
        description,
        price: parseFloat(price),
        location,
      };
      if (imageUrl) updates.image_url = imageUrl;

      const { error: updateError } = await supabase
        .from("land_properties")
        .update(updates)
        .eq("id", editingId)
        .eq("user_id", currentUserId);

      if (updateError) {
        alert("Error al actualizar terreno. Inténtalo más tarde.");
        console.error(updateError);
      } else {
        alert("Terreno actualizado correctamente.");
        resetForm();
        fetchTerrenos();
      }
    } else {
      // Insertar nuevo terreno (imagen es obligatoria)
      if (!imageUrl) {
        alert("Debes seleccionar una imagen para la portada.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("land_properties")
        .insert({
          user_id: currentUserId,
          title,
          description,
          price: parseFloat(price),
          location,
          image_url: imageUrl,
          status: "disponible",
        });

      if (insertError) {
        alert("Error al publicar terreno. Inténtalo más tarde.");
        console.error(insertError);
      } else {
        alert("Terreno publicado con éxito.");
        resetForm();
        fetchTerrenos();
      }
    }

    setLoading(false);
  };

  // Cargar datos para editar
  const handleEdit = (terreno: Terreno) => {
    if (currentUserId !== terreno.user_id) {
      alert("Solo puedes editar tus propios terrenos.");
      return;
    }
    setEditingId(terreno.id);
    setTitle(terreno.title);
    setDescription(terreno.description);
    setPrice(terreno.price.toString());
    setLocation(terreno.location);
    setImagePreview(terreno.image_url);
    setImage(null); // para que no se suba otra imagen si no se cambia
  };

  // Cancelar edición
  const cancelEdit = () => {
    resetForm();
  };

  // Reset formulario
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setLocation("");
    setImage(null);
    setImagePreview("");
  };

  // Eliminar terreno con confirmación
  const handleDelete = async (id: string, userId: string) => {
    if (currentUserId !== userId) {
      alert("Solo puedes eliminar tus propios terrenos.");
      return;
    }

    if (!confirm("¿Seguro que quieres eliminar este terreno? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("land_properties").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      alert("Error al eliminar terreno.");
      console.error(error);
    } else {
      alert("Terreno eliminado.");
      fetchTerrenos();
    }
    setLoading(false);
  };

  // Cambiar estado entre disponible y vendido
  const toggleStatus = async (terreno: Terreno) => {
    if (currentUserId !== terreno.user_id) {
      alert("Solo puedes cambiar el estado de tus propios terrenos.");
      return;
    }

    const newStatus = terreno.status === "disponible" ? "vendido" : "disponible";

    setLoading(true);
    const { error } = await supabase
      .from("land_properties")
      .update({ status: newStatus })
      .eq("id", terreno.id)
      .eq("user_id", currentUserId);

    if (error) {
      alert("Error al cambiar estado.");
      console.error(error);
    } else {
      fetchTerrenos();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold mb-4">{editingId ? "Editar terreno" : "Publicar nuevo terreno"}</h2>

        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={loading}
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={loading}
          rows={4}
        />
        <input
          type="number"
          placeholder="Precio (S/.)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 border rounded"
          required
          min={0}
          step="0.01"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={loading}
        />

        <div>
          <label className="block mb-1 font-semibold">Imagen de portada {editingId ? "(opcional para mantener actual)" : "*"}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Vista previa"
              className="mt-2 h-40 w-full object-cover rounded border"
            />
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded flex-1"
          >
            {loading ? "Guardando..." : editingId ? "Actualizar Terreno" : "Publicar Terreno"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded flex-1"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          Se encontraron {terrenos.length} terrenos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terrenos.map((terreno) => (
            <div
              key={terreno.id}
              className={`border rounded overflow-hidden shadow bg-white flex flex-col`}
            >
              <img
                src={terreno.image_url}
                alt={terreno.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg">{terreno.title}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Ubicación: {terreno.location}
                </p>
                <p className="text-gray-700 mb-2 flex-grow">{terreno.description}</p>
                <p className={`font-bold text-lg mb-2 ${terreno.status === "disponible" ? "text-green-600" : "text-red-600"}`}>
                  S/. {terreno.price.toLocaleString("es-PE")} — {terreno.status.toUpperCase()}
                </p>

                {currentUserId === terreno.user_id && (
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
                        terreno.status === "disponible" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
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
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
