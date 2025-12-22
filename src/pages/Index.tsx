// src/pages/Index.tsx
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  Filter,
  ArrowRight,
  HistoryIcon,
} from "lucide-react";
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
import CountUp from "react-countup";

type Terreno = {
  id: number;
  titulo: string;
  precio: number;
  moneda?: string;
  area: number;
  ubicacion: string;
  imagen: string;
  portada: string | null;
  descripcion: string;
  tipo: string;
  status: string;
  user_id: string;
  videos?: string[];
};
// Convierte texto con URLs en enlaces clickeables SIN duplicar la URL
const TextWithLinks = ({ text }: { text: string }) => {
  const urlRegex = /((https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+))/gi;
  const match = text.match(urlRegex);

  // Si no hay URL, muestra el texto tal cual
  if (!match) {
    return <span>{text}</span>;
  }

  // Tomamos solo la primera URL encontrada
  const url = match[0];

  // Quitamos la URL del texto original para no repetirla visualmente
  const textoSinUrl = text.replace(url, "").trim();

  // Aseguramos que el href tenga http/https
  const href = /^https?:\/\//i.test(url) ? url : "http://" + url;

  return (
    <>
      {/* Texto sin la URL */}
      {textoSinUrl && <span>{textoSinUrl} </span>}

      {/* Enlace clickeable una sola vez */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all inline-block"
      >
        {url}
      </a>
    </>
  );
};


const carouselImages = [
  "/quinua2.png",
  "/banner.png",
  "/fondo.png",
  "/fondo2.png",
  "/fondo3.png",
];

const ITEMS_PER_PAGE = 6;

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [terrenos, setTerrenos] = useState<Terreno[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchTerrenos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("land_properties")
        .select("*")
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

  const terrenosFiltrados = terrenos.filter((terreno) => {
    const cumpleTipo =
      filtroTipo === "todos" ||
      terreno.tipo.toLowerCase() === filtroTipo.toLowerCase();
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

  const totalPages = Math.ceil(terrenosFiltrados.length / ITEMS_PER_PAGE);
  const terrenosPaginados = terrenosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatPrecio = (precio: number, moneda: string = "PEN") => {
    const currencyCode = moneda === "USD" ? "USD" : "PEN";
    const locale = moneda === "USD" ? "en-US" : "es-PE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(precio);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section con carrusel de fondo */}
      <section
        className="relative h-auto md:h-96 text-white overflow-hidden bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('${carouselImages[currentImageIndex]}')`,
        }}
        aria-label="Sección principal de bienvenida con imagen de fondo en carrusel"
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col md:flex-row items-center md:items-start">
          <div className="max-w-2xl z-10 mt-8 md:mt-0 text-center md:text-left mx-auto md:mx-0">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Encuentra tu Terreno Ideal en Ayacucho
            </h2>
            <p className="text-base md:text-xl mb-6">
              Invierte en el futuro. Descubre terrenos con ubicación privilegiada
              en la histórica ciudad de Ayacucho.
            </p>
            <Link to="/gestion" className="inline-block">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
                aria-label="Ver catálogo de terrenos"
              >
                Gestionar Mis Terrenos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {/* TARJETA SOBRE NOSOTROS */}
            <div
              className="
                relative w-full max-w-sm bg-white rounded-xl shadow-lg p-6 md:p-8 text-gray-800 z-30 mt-6 mb-4 
                md:absolute md:bottom-12 md:right-2 md:mt-0 md:w-120
              "
            >
              <h2 className="text-2xl font-bold mb-1 text-green-700">
                Sobre Nosotros
              </h2>
              <p className="text-sm text-justify text-gray-600">
                BITAFAM es tu socio confiable en la búsqueda del terreno perfecto,
                nos dedicamos a conectar a nuestros clientes con las mejores
                oportunidades de inversión, ofreciendo un servicio transparente,
                profesional y personalizado. Nuestra misión es ayudarte a
                encontrar el lugar ideal para construir tus sueños.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Buscador */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Input
                placeholder="Buscar por ubicación o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTerminoBusqueda(busqueda);
                    setCurrentPage(1);
                  }
                }}
                className="flex-1 min-w-0"
                aria-label="Buscar por ubicación o nombre"
              />
              <button
                onClick={() => {
                  setTerminoBusqueda(busqueda);
                  setCurrentPage(1);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Filtro Tipo */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 h-5 w-5" aria-hidden="true" />
              <Select
                value={filtroTipo}
                onValueChange={(val) => {
                  setFiltroTipo(val);
                  setCurrentPage(1);
                }}
                aria-label="Filtrar por tipo"
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
              aria-label="Filtrar por precio"
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
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-gray-500 text-lg">Cargando terrenos...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Se encontraron {terrenosFiltrados.length} terrenos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {terrenosFiltrados.map((terreno) => (
                <Card
                  key={terreno.id}
                  className="hover:shadow-lg transition-shadow duration-300 flex flex-col"
                >
                  <div className="relative">
                    {terreno.portada ? (
                      terreno.portada.endsWith(".mp4") ? (
                        <video
                          src={terreno.portada}
                          controls
                          className="w-full h-48 object-contain rounded-t-lg"
                        />
                      ) : (
                        <img
                          src={terreno.portada}
                          alt={terreno.titulo}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )
                    ) : terreno.videos && terreno.videos.length > 0 ? (
                      <video
                        src={terreno.videos[0]}
                        controls
                        className="w-full h-48 object-contain rounded-t-lg"
                      />
                    ) : (
                      <img
                        src={terreno.imagen}
                        alt={terreno.titulo}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white capitalize">
                      {terreno.tipo}
                    </Badge>
                    {terreno.status === "vendido" && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                        VENDIDO
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 truncate">
                      {terreno.titulo}
                    </CardTitle>
                    <CardDescription className="flex items-center text-gray-600 truncate">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                      <TextWithLinks text={terreno.ubicacion} />
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {terreno.descripcion}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-green-600 whitespace-nowrap">
                        {formatPrecio(terreno.precio, terreno.moneda || "PEN")}
                      </span>
                      <span className="text-gray-500 font-medium whitespace-nowrap">
                        {terreno.area} m²
                      </span>
                    </div>
                    <Link to={`/terreno/${terreno.id}`}>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 mb-2"
                        aria-label={`Ver detalles del terreno ${terreno.titulo}`}
                      >
                        Ver Detalles
                      </Button>
                    </Link>
                    {user && user.id === terreno.user_id && (
                      <div className="flex flex-col gap-2 mt-auto">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const nuevoEstado =
                              terreno.status === "vendido" ? "disponible" : "vendido";
                            const { error } = await supabase
                              .from("land_properties")
                              .update({ status: nuevoEstado })
                              .eq("id", terreno.id);
                            if (!error) {
                              setTerrenos((prev) =>
                                prev.map((t) =>
                                  t.id === terreno.id ? { ...t, status: nuevoEstado } : t
                                )
                              );
                            } else {
                              alert("Error al actualizar estado");
                            }
                          }}
                          aria-label={
                            terreno.status === "vendido"
                              ? "Marcar terreno como disponible"
                              : "Marcar terreno como vendido"
                          }
                        >
                          {terreno.status === "vendido"
                            ? "Marcar como disponible"
                            : "Marcar como vendido"}
                        </Button>
                        <Button
                          onClick={() => {
                            navigate(`/editar/${terreno.id}`, { state: { terreno } });
                          }}
                          aria-label={`Editar terreno ${terreno.titulo}`}
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
                          aria-label={`Eliminar terreno ${terreno.titulo}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

           

            {terrenosFiltrados.length === 0 && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <p className="text-gray-500 text-lg">
                  No se encontraron terrenos que coincidan con los filtros seleccionados.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="bg-gray-100 py-14 w-full">
        <h3 className="text-3xl font-bold text-green-800 mb-12 text-center w-full px-4 sm:px-6 lg:px-0">
          ¿Por qué Elegirnos?
        </h3>

        <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-10 lg:px-24 gap-10 md:gap-0">
        <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-10 lg:px-24 gap-10">
  {/* Tarjetas izquierda */}
  <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-8 w-full md:w-[63vw] lg:w-[68vw]">
    {[
      {
        img: "https://img.freepik.com/foto-gratis/parcelas-tierra-paisaje-natural-pin-ubicacion_23-2149937913.jpg",
        title: "TERRENOS / LOTES",
        desc: "Amplias parcelas de terreno, ideales para proyectos residenciales, comerciales o agrícolas. Oportunidad para inversionistas que buscan construir y crecer.",
      },
      {
        img: "https://alqzzwzgzvvugtdjlqym.supabase.co/storage/v1/object/public/land-images/terrenos/1755105091458_sala.png",
        title: "DEPARTAMENTOS",
        desc: "Modernos departamentos diseñados para ofrecer comodidad y funcionalidad, con acabados de calidad y ubicaciones cercanas a servicios esenciales. Perfectos para vivir o invertir.",
      },
      {
        img: "https://www.argentinaproduct.com/ckfinder/userfiles/files/blog/alq06.jpg",
        title: "ALQUILERES",
        desc: "Variedad de opciones de alquiler que se adaptan a diferentes necesidades, desde viviendas hasta locales comerciales, con excelentes condiciones y ubicaciones accesibles.",
      },
    ].map(({ img, title, desc }, i) => (
      <div
        key={i}
        className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl group w-full sm:w-[45%] md:w-[30%] min-w-[230px] max-w-[400px]"
      >
        <img
          src={img}
          alt={title}
          className="w-full h-44 object-cover object-center block"
        />

        {/* Franja de título más compacta, sin botón */}
        <div className="bg-green-900 text-white text-center font-bold text-base md:text-lg px-3 py-3 w-full">
          {title}
        </div>

        {/* Descripción que aparece al hacer hover */}
        <div className="max-h-0 overflow-hidden bg-green-800 text-green-200 text-sm px-4 pt-0 pb-0 text-center transition-all duration-500 group-hover:max-h-32 group-hover:pt-3 group-hover:pb-4">
          {desc}
        </div>
      </div>
    ))}
  </div>
</div>


          {/* Conteos derecha */}
          <div className="grid grid-cols-1 gap-12 text-center w-full max-w-md md:w-[30vw] lg:w-[27vw] px-4 md:px-0">
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={15} duration={5} prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Años de Experiencia
              </p>
            </div>
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={1400} duration={5} separator="," prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Personas beneficiados
              </p>
            </div>
            <div>
              <p className="text-cyan-600 font-extrabold text-5xl mb-2">
                <CountUp start={0} end={50} duration={5} separator="," prefix="+ " />
              </p>
              <p className="uppercase font-semibold text-green-800 tracking-wide text-xl">
                Inversionistas capacitados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Sobre Ayacucho */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin
                  className="text-green-600 h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-xl font-semibold mb-2">Ubicación Estratégica</h4>
              <p className="text-gray-600">Centro geográfico del Perú.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight
                  className="text-amber-600 h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-xl font-semibold mb-2">Crecimiento Económico</h4>
              <p className="text-gray-600">Nuevas oportunidades de inversión.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HistoryIcon
                  className="text-blue-600 h-8 w-8"
                  aria-hidden="true"
                />
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
                <p>✉️ grupobitafam@gmail.com</p>
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
