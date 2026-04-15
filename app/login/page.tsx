'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase'; 
import { useRouter } from 'next/navigation';

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
      setError('Credenciales incorrectas. Intenta nuevamente.');
      setLoading(false);
    } else {
      router.push('/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-light text-neutral-800 tracking-tight">Acceso al Sistema</h1>
          <p className="text-sm text-neutral-400 mt-2">Monitoreo y control de seguridad</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors bg-neutral-50/50 text-neutral-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors bg-neutral-50/50 text-neutral-800"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3.5 rounded-lg font-medium hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>

      </div>
    </div>
  );
}