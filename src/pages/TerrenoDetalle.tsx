import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Phone, Mail, MessageSquare, Share2, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import ContactForm from '@/components/ContactForm';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';

const TerrenoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const currentUser = session?.user;
  
  const [terreno, setTerreno] = useState<any>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const fetchTerreno = async () => {
      const { data, error } = await supabase
        .from('land_properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener terreno:', error);
      } else {
        setTerreno(data);
      }
    };

    fetchTerreno();
  }, [id]);

  const enviarEmail = () => {
    if (!terreno) return '#';
    const email = 'yoelroc@gmail.com';
    const asunto = encodeURIComponent(`Consulta sobre terreno: ${terreno.titulo}`);
    const cuerpo = encodeURIComponent(`Hola,\n\nEstoy interesado en obtener más información sobre el terreno "${terreno.titulo}". Por favor, contáctenme.\n\nGracias.`);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`;
  };

  const contactarWhatsApp = () => {
    if (!terreno) return 'https://wa.me/998026135';
    const phone = '998026135';
    const mensaje = encodeURIComponent(`Hola, estoy interesado en el terreno "${terreno.titulo}". Por favor, contáctenme.`);
    return `https://wa.me/${phone}?text=${mensaje}`;
  };

  if (!terreno) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Terreno no encontrado</h1>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const imagenes: string[] = terreno.imagenes || [terreno.imagen];
  const detalles = {
    dimensiones: terreno.dimensiones || 'No especificado',
    topografia: terreno.topografia || 'No especificado',
    acceso: terreno.acceso || 'No especificado',
    zonificacion: terreno.zonificacion || 'No especificado',
    servicios: terreno.servicios ? terreno.servicios.split(',') : [],
    documentos: terreno.documentacion || 'No especificado',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-green-600 hover:text-green-700">
            <ArrowLeft className="h-5 w-5" />
            <span>Volver al catálogo</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2">
            {/* Galería de Imágenes */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={imagenes[imagenActual]}
                    alt={terreno.titulo}
                    className="w-full h-96 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-4 right-4 bg-green-600 text-white" variant="secondary">
                    {terreno.tipo}
                  </Badge>
                  {terreno.status === 'vendido' && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded shadow-md">
                      VENDIDO
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {imagenes.map((img: string, index: number) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Vista ${index + 1}`}
                        className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${
                          imagenActual === index ? 'border-green-600' : 'border-gray-200'
                        }`}
                        onClick={() => setImagenActual(index)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Principal */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-gray-800">{terreno.titulo}</CardTitle>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-5 w-5 mr-2" />
                      {terreno.ubicacion}
                    </div>
                  </div>
                  {currentUser?.id === terreno.user_id && (
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => window.location.href = `/editar/${terreno.id}`}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Precio</h4>
                    <p className="text-2xl font-bold text-green-600">
                      S/. {Number(terreno.precio).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Área</h4>
                    <p className="text-2xl font-bold text-blue-600">{terreno.area} m²</p>
                  </div>
                </div>
                <p className="text-gray-700 text-lg">{terreno.descripcion}</p>
              </CardContent>
            </Card>

            {/* Detalles Técnicos */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Terreno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Dimensiones</h4>
                    <p className="text-gray-600">{detalles.dimensiones}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Topografía</h4>
                    <p className="text-gray-600">{detalles.topografia}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Acceso</h4>
                    <p className="text-gray-600">{detalles.acceso}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Zonificación</h4>
                    <p className="text-gray-600">{detalles.zonificacion}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Servicios Disponibles</h4>
                    <div className="flex flex-wrap gap-2">
                      {detalles.servicios.map((servicio: string, index: number) => (
                        <Badge key={index} variant="outline">{servicio}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Documentación</h4>
                    <p className="text-gray-600">{detalles.documentos}</p>
                  </div>
                </div>

                {/* Mostrar botón de edición si es dueño */}
                {currentUser?.id === terreno.user_id && (
                  <div className="mt-6">
                    <Button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => window.location.href = `/editar/${terreno.id}`}
                    >
                      Editar publicación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de Contacto */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">¿Interesado en este terreno?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-yellow-700"
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Solicitar Información
                </Button>

                <a
                  href={enviarEmail()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-red-600 hover:bg-yellow-700 flex items-center justify-center mt-2">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                </a>

                <a
                  href={contactarWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-yellow-700 flex items-center justify-center mt-2">
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp BITAFAM
                  </Button>
                </a>

                {mostrarFormulario && (
                  <div className="mt-6">
                    <ContactForm terrenoId={terreno.id} />
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Información de Contacto</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📞 998 026 135</p>
                    <p>✉️ yoelroc@gmail.com</p>
                    <p>📍 Alfonso Ugarte 101, Ayacucho</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Horarios de Atención</h4>
                  <div className="space-y-1 text-sm text-blue-600">
                    <p>Lun - Vie: 9:00 AM - 6:00 PM</p>
                    <p>Sábados: 9:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerrenoDetalle;
