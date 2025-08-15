import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient"; // IMPORTACIÓN CON LLAVES (named import)
import { Button } from "./ui/button";
import { Phone, Mail, UserRoundMinusIcon } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      console.log("User ID para consulta:", user.id);
      supabase
        .from("users")
        .select("name") // Cambia "name" si usas otro campo como "apodo" o "nickname"
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error en consulta Supabase:", error.message);
            setProfileName("");
          } else {
            console.log("Nombre del usuario obtenido:", data?.name);
            setProfileName(data?.name || "");
          }
        });
    } else {
      setProfileName("");
    }
  }, [user]);

  const handleLogout = () => {
    const confirmar = window.confirm("¿Seguro que deseas cerrar sesión?");
    if (confirmar) {
      logout();
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/bitafamcolor.png"
            alt="Logo BITAFAM"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-4">

          <Link to="/publicar">
            <Button variant="outline" className="text-sm font-medium">
              Publicar
            </Button>
          </Link>

          <a
            href="https://wa.me/998026135"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-green-600 hover:bg-green-700 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contactar BITAFAM
            </Button>
          </a>

          {user ? (
            <>
              <Button variant="outline" className="flex items-center space-x-2">
                <UserRoundMinusIcon className="h-4 w-4" />
                <span className="hidden md:inline">
                  {profileName || user.email}
                </span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="text-sm"
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" className="text-sm">
                Iniciar sesión
              </Button>
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
};

export default Navbar;
