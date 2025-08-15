// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
      } else {
        setAuthenticated(true);
      }

      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <Loader2 className="animate-spin h-6 w-6 text-green-600" />
        <span className="ml-2 text-gray-500">Verificando sesión...</span>
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}
