'use client';

import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans">
      {/* Barra Lateral (Sidebar) Minimalista */}
      <aside className="w-20 md:w-64 bg-white border-r border-neutral-100 flex flex-col transition-all">
        <div className="p-6">
          <span className="font-bold text-xl tracking-tighter text-neutral-800 hidden md:block">FocusSafe.</span>
          <span className="font-bold text-xl tracking-tighter text-neutral-800 md:hidden">FS.</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {['Inicio', 'Cámaras', 'Actividad', 'Configuración'].map((item) => (
            <div 
              key={item} 
              className="p-3 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg cursor-pointer transition-colors font-medium"
            >
              {item}
            </div>
          ))}
        </nav>

        {/* Botón de Salir */}
        <div className="p-4 border-t border-neutral-100">
          <button 
            onClick={handleLogout}
            className="w-full text-left p-3 text-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal (Aquí cargará el page.tsx) */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}