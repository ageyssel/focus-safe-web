'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales no autorizadas');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] space-y-8">
        
        {/* Logo y Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-neutral-100 flex items-center justify-center p-4 mb-2">
            <img 
              src="/logo-focus.png" 
              alt="FocusSafe" 
              className="w-full h-full object-contain opacity-90"
            />
          </div>
          <h2 className="text-3xl font-extralight tracking-tighter text-neutral-800">FocusSafe</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
            Intelligence & Security Access
          </p>
        </div>

        {/* Formulario Estilo Tacto */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-neutral-100">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full bg-neutral-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none text-neutral-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full bg-neutral-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-neutral-900/5 transition-all outline-none text-neutral-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-red-500 font-bold uppercase tracking-widest text-center animate-pulse">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white rounded-[1.5rem] py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Validando...' : (
                <>
                  Ingresar <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Minimalista */}
        <footer className="text-center">
          <p className="text-[10px] text-neutral-300 font-medium uppercase tracking-widest">
            © 2026 FocusSafe Chile • Private Protocol
          </p>
        </footer>
      </div>
    </div>
  );
}