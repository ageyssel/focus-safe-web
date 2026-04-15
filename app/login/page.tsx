'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Credenciales no autorizadas');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] font-sans">
      
      {/* Panel Izquierdo - Branding (Oculto en celulares pequeños) */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A192F] relative overflow-hidden flex-col justify-between p-12 lg:p-20">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37] via-transparent to-transparent"></div>
        <div className="relative z-10">
          <ShieldCheck size={48} className="text-[#D4AF37] mb-6" strokeWidth={1} />
          <h1 className="text-5xl lg:text-6xl font-extralight text-white tracking-tighter leading-tight mb-4">
            Inteligencia en<br />Protección.
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase font-semibold">Private Security Protocol</p>
        </div>
        <div className="relative z-10">
          <p className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">FocusSafe Systems © 2026</p>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-10">
          
          <div className="text-center md:text-left space-y-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center p-4 mx-auto md:mx-0">
              <img src="/logo-focus.png" alt="FocusSafe" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mt-6">Bienvenido</h2>
            <p className="text-sm text-slate-500">Ingresa tus credenciales para acceder al panel de monitoreo.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#0A192F] transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0A192F]/10 focus:border-[#0A192F] transition-all outline-none text-slate-800 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#0A192F] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0A192F]/10 focus:border-[#0A192F] transition-all outline-none text-slate-800 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs font-semibold text-[#0A192F] hover:text-[#D4AF37] transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest text-center animate-pulse bg-red-50 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A192F] text-white rounded-[1.5rem] py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-900/20"
            >
              {loading ? 'Verificando...' : <>Ingresar <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}