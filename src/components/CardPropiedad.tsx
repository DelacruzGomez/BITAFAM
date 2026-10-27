import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; 
import { Heart } from "lucide-react"; 

interface CardPropiedadProps {
  terreno: any;
  onEliminar?: (id: string) => void;
  onMarcarVendido?: (id: string) => void;
}

export const CardPropiedad: React.FC<CardPropiedadProps> = ({ 
  terreno, 
  onEliminar,
  onMarcarVendido 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col font-sans transition-all duration-300 hover:shadow-lg h-full justify-between max-w-[340px] mx-auto">
      
      {/* Contenedor de Imagen / Video */}
      <div className="relative aspect-[4/3] bg-gray-50 w-full overflow-hidden">
        {terreno.portada ? (
          terreno.portada.endsWith(".mp4") ? (
            <video src={terreno.portada} className="w-full h-full object-cover" controls />
          ) : (
            <img src={terreno.portada} alt={terreno.titulo} className="w-full h-full object-cover" />
          )
        ) : (
          <img src={terreno.imagen || "/placeholder.png"} alt={terreno.titulo} className="w-full h-full object-cover" />
        )}
        
        {/* Badge Tipo Superior Derecho */}
        <span className="absolute top-3 right-3 bg-green-600 text-white font-semibold text-xs tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm">
          {terreno.tipo || "TERRENO"}
        </span>

        {/* Badge VENDIDO si corresponde */}
        {terreno.status === "vendido" && (
          <span className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs tracking-wider px-2.5 py-1 rounded-md shadow-sm">
            VENDIDO
          </span>
        )}
      </div>

      {/* Cuerpo de Detalles */}
      <div className="p-4 flex flex-col gap-2 flex-grow justify-between">
        <div className="space-y-1">
          {/* Subtítulo Categoría */}
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {terreno.tipo || "TERRENO"} • URBANO
            </span>
            {/* Icono Corazón Favorito */}
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Título Principal */}
          <h3 className="text-lg font-extrabold text-gray-900 leading-tight uppercase line-clamp-1">
            {terreno.titulo}
          </h3>
          
          {/* Dirección fija */}
          <p className="text-sm text-gray-500 font-medium">
            Dirección disponible en el mapa
          </p>
        </div>

        {/* Botón Google Maps - 🛠️ COMPLETAMENTE CORREGIDO */}
        <a 
          href={`https://google.com{encodeURIComponent(terreno.ubicacion || '')}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors mt-1"
        >
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Ver Ubicación en Google Maps
        </a>

        {/* Icono Cuadrícula y Área Metros Cuadrados - 🛠️ COMPLETAMENTE CORREGIDO */}
        <div className="flex items-center gap-2 text-gray-700 text-sm font-semibold mt-1 border-b border-gray-100 pb-2">
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          <span>{terreno.area} m²</span>
        </div>

        {/* Descripción corta / Características breves */}
        <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mt-1">
          👉 {terreno.descripcion || "Sin descripción adicional de la propiedad."}
        </p>

        {/* Bloque de Precio Exacto - 🛠️ ESCAPADO DE CARÁCTER \$ CORREGIDO */}
        <div className="mt-1">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {terreno.moneda === "USD" ? "\$" : "S/"} {Number(terreno.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* BOTONERA DE ACCIONES COMPLETA */}
        <div className="mt-2 flex flex-col gap-2">
          <Link to={`/terreno/${terreno.id}`} className="w-full">
            <Button className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 rounded-xl text-sm transition-colors h-11">
              Ver Detalles
            </Button>
          </Link>

          {/* Botón Marcar como vendido */}
          <Button 
            variant="outline" 
            className="w-full text-gray-700 font-semibold border-gray-200 text-xs py-2 rounded-lg h-9 hover:bg-gray-50"
            onClick={() => onMarcarVendido && onMarcarVendido(terreno.id)}
          >
            Marcar como vendido
          </Button>
          
          {/* Botones de Administración (Editar y Eliminar) */}
          <div className="flex gap-2 w-full">
            <Link to={`/editar/${terreno.id}`} className="flex-1">
              <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 rounded-lg">
                Editar
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              className="flex-1 text-white text-xs font-bold h-9 rounded-lg"
              onClick={() => onEliminar && onEliminar(terreno.id)}
            >
              Eliminar
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
