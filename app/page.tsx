'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
      <p className="text-sm text-neutral-400 animate-pulse">Cargando FocusSafe...</p>
    </div>
  );
}