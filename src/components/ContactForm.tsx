
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send } from 'lucide-react';

interface ContactFormProps {
  terrenoId?: number;
}

const ContactForm = ({ terrenoId }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Simular envío del formulario
    setTimeout(() => {
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: ''
      });
      setEnviando(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Solicitar Información</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="999 123 456"
              required
            />
          </div>

          <div>
            <Label htmlFor="mensaje">Mensaje</Label>
            <Textarea
              id="mensaje"
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              placeholder={terrenoId ? 
                "Estoy interesado en el terreno y me gustaría recibir más información..." :
                "Escribe tu consulta aquí..."
              }
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={enviando}
          >
            {enviando ? (
              "Enviando..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensaje
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Al enviar este formulario, aceptas que nos pongamos en contacto contigo 
            para brindarte información sobre nuestros terrenos.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
