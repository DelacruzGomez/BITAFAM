// src/pages/Index.tsx
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Filter, Phone, Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

type Terreno = {
  id: number;
  titulo: string;
  precio: number;
  area: string;
  ubicacion: string;
  imagen: string;
  portada: string | null; // ✅ nueva columna
  descripcion: string;
  tipo: string;
  status: string;
  user_id: string;
};

const carouselImages = [
  "/quinua2.png",
  "/banner.png",
  "/fondo.png",
  "/fondo2.png",
  "/fondo3.png",// Agrega las rutas de tus imágenes aquí
];

const ITEMS_PER_PAGE = 6;

const Index = () => {
  const navigate = useNavigate(); // ✅  Dentro del componente
  const { user, logout } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);


   // Cambiar imagen del carrusel automáticamente cada 3 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Cargar terrenos
  useEffect(() => {
    const fetchTerrenos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
        //.eq("status", "disponible") // Puedes descomentar para filtrar terreno disponibles
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error al cargar terrenos:", error.message);
      } else {
        setTerrenos(data || []);
      }
      setLoading(false);
    };
    fetchTerrenos();
  }, []);

  // Filtrado
  const terrenosFiltrados = terrenos.filter((terreno) => {
    // CORRECCIÓN: uso == y ===, no asignación =
    const cumpleTipo =
      filtroTipo === "todos" || terreno.tipo.toLowerCase() === filtroTipo;
    const cumplePrecio =
      filtroPrecio === "todos" ||
      (filtroPrecio === "bajo" && terreno.precio < 80000) ||
      (filtroPrecio === "medio" &&
        terreno.precio >= 80000 &&
        terreno.precio <= 120000) ||
      (filtroPrecio === "alto" && terreno.precio > 120000);
    const cumpleBusqueda =
      terreno.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      terreno.ubicacion.toLowerCase().includes(terminoBusqueda.toLowerCase());
    return cumpleTipo && cumplePrecio && cumpleBusqueda;
  });

  // Paginación
  const totalPages = Math.ceil(terrenosFiltrados.length / ITEMS_PER_PAGE);
  const terrenosPaginados = terrenosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <Navbar />
      {/* Hero Section con carrusel de fondo */}
      <section
        className="relative h-96 text-white overflow-hidden bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('${carouselImages[currentImageIndex]}')`,
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          {/* Columna principal de mensaje */}
          <div className="max-w-2xl z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Encuentra tu Terreno Ideal en Ayacucho
            </h2>
            <p className="text-lg md:text-xl mb-6">
              Invierte en el futuro. Descubre terrenos con ubicación
              privilegiada en la histórica ciudad de Ayacucho.
            </p>
            <Link to="/terrenos">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
            >
              Ver Catálogo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            </Link>

          </div>
        </div>
        {/* TARJETA SOBRE NOSOTROS */}
        <div className="absolute bottom-12 right-2 md:w-120 w-full max-w-xs bg-white rounded-xl shadow-lg p-6 md:p-8 text-gray-800 z-30">
          <h2 className="text-2xl font-bold mb-1 text-green-700">Sobre Nosotros</h2>
          <p className="text-sm text-justify text-gray-600">
            BITAFAM es tu socio confiable en la búsqueda del terreno perfecto, nos
            dedicamos a conectar a nuestros clientes con las mejores oportunidades
            de inversión, ofreciendo un servicio transparente, profesional y
            personalizado. Nuestra misión es ayudarte a encontrar el lugar ideal para
            construir tus sueños.
          </p>
        </div>
      </section>

      {/* FILTROS */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Buscador */}
            <div className="flex items-center space-x-2 flex-1">
              <Input
                placeholder="Buscar por ubicación o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTerminoBusqueda(busqueda);
                    setCurrentPage(1); // Reiniciar paginación al buscar
                  }
                }}
                className="flex-1"
              />
              <button
                onClick={() => {
                  setTerminoBusqueda(busqueda);
                  setCurrentPage(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Filtro Tipo */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 h-5 w-5" />
              <Select
                value={filtroTipo}
                onValueChange={(val) => {
                  setFiltroTipo(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="campestre">Campestre</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="urbano">Urbano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Precio */}
            <Select
              value={filtroPrecio}
              onValueChange={(val) => {
                setFiltroPrecio(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los precios</SelectItem>
                <SelectItem value="bajo">Hasta S/. 80,000</SelectItem>
                <SelectItem value="medio">S/. 80,000 - S/. 120,000</SelectItem>
                <SelectItem value="alto">Más de S/. 120,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Cargando terrenos...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Se encontraron {terrenosFiltrados.length} terrenos
            </p>
            {/* Grid de Terrenos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {terrenosPaginados.map((terreno) => (
                <Card
                  key={terreno.id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative">
                    <img
                      src={terreno.portada || terreno.imagen}
                      alt={terreno.titulo}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {/* Tipo del terreno */}
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white capitalize">
                      {terreno.tipo}
                    </Badge>
                    {/* Rótulo VENDIDO */}
                    {terreno.status === "vendido" && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                        VENDIDO
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">
                      {terreno.titulo}
                    </CardTitle>
                    <CardDescription className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {terreno.ubicacion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{terreno.descripcion}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-green-600">
                        S/. {terreno.precio.toLocaleString()}
                      </span>
                      <span className="text-gray-500 font-medium">{terreno.area}</span>
                    </div>
                    <Link to={`/terreno/${terreno.id}`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 mb-2">
                        Ver Detalles
                      </Button>
                    </Link>
                    {/* Mostrar acciones si es el dueño */}
                    {user && user.id === terreno.user_id && (
                      <div className="flex flex-col gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const nuevoEstado =
                              terreno.status === "vendido"
                                ? "disponible"
                                : "vendido";
                            const { error } = await supabase
                              .from("land_properties")
                              .update({ status: nuevoEstado })
                              .eq("id", terreno.id);
                            if (!error) {
                              setTerrenos((prev) =>
                                prev.map((t) =>
                                  t.id === terreno.id
                                    ? { ...t, status: nuevoEstado }
                                    : t
                                )
                              );
                            } else {
                              alert("Error al actualizar estado");
                            }
                          }}
                        >
                          {terreno.status === "vendido"
                            ? "Marcar como disponible"
                            : "Marcar como vendido"}
                        </Button>
                        <Button
                          onClick={() => {
                            navigate(`/editar/${terreno.id}`, { state: { terreno } });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            const confirmar = window.confirm(
                              "¿Seguro que deseas eliminar este terreno?"
                            );
                            if (!confirmar) return;
                            const { error } = await supabase
                              .from("land_properties")
                              .delete()
                              .eq("id", terreno.id);
                            if (!error) {
                              setTerrenos((prev) =>
                                prev.filter((t) => t.id !== terreno.id)
                              );
                            } else {
                              alert("Error al eliminar");
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}

            {terrenosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No se encontraron terrenos que coincidan con los filtros seleccionados.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Sección Sobre Ayacucho */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              ¿Por qué invertir en BITAFAM?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ayacucho es una ciudad en crecimiento con gran potencial de desarrollo,
              rica historia y ubicación estratégica.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-green-600 h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Ubicación Estratégica</h4>
              <p className="text-gray-600">Centro geográfico del Perú.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="text-amber-600 h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Crecimiento Económico</h4>
              <p className="text-gray-600">Nuevas oportunidades de inversión.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-green-600 h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Historia y Cultura</h4>
              <p className="text-gray-600">Patrimonio que impulsa el turismo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/bitafam.png"
                  alt="Logo BITAFAM"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400">
                Tu socio confiable en la búsqueda del terreno perfecto en Ayacucho.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400">
                <p>📞 998 026 135</p>
                <p>✉️ yoelroc@gmail.com</p>
                <p>📍 Alfonso Ugarte 101, Ayacucho</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Horarios</h4>
              <div className="space-y-2 text-gray-400">
                <p>Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábados: 9:00 AM - 2:00 PM</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; BITAFAM. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;