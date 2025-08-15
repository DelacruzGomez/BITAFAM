import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, X, ArrowLeft, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        if (loginError.message.includes("Email not confirmed")) {
          setError("Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu Gmail.");
        } else {
          setError("Correo o contraseña incorrectos. Verifica e intenta nuevamente.");
        }
      } else {
        navigate("/");
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100"
      style={{
        backgroundImage: "url('fondologin.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
        {/* Botón Volver con flecha */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center text-green-600 hover:text-green-700 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Volver
        </button>

        {/* Botón cerrar en esquina superior derecha */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-green-600 hover:text-green-700 transition-colors"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Iniciar Sesión</h2>
        <p className="text-center text-green-700 mb-6 font-semibold">
          Bienvenido a BITAFAM 
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-semibold text-green-700">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="h-5 w-5 text-green-400 absolute left-3 top-3" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full pl-10 pr-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-green-700">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="h-5 w-5 text-green-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full pl-10 pr-10 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-green-600"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-green-700">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-green-800 hover:text-green-900 font-semibold transition-colors"
              aria-label="Ir a registrarse"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
