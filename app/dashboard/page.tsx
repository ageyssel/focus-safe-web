'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos y escuchar cambios en tiempo real
  useEffect(() => {
    const fetchData = async () => {
      const { data: siteData } = await supabase.from('sites').select('*').limit(1).single();
      if (siteData) {
        setSite(siteData);
        const { data: logsData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('site_id', siteData.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (logsData) setLogs(logsData);
      }
      setLoading(false);
    };

    fetchData();

    const siteChannel = supabase
      .channel('cambios-sitios')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, 
      (payload) => {
        setSite(payload.new);
      })
      .subscribe();

    const logsChannel = supabase
      .channel('cambios-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, 
      (payload) => {
        setLogs((currentLogs) => [payload.new, ...currentLogs].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;

    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);

    let textoAccion = '';
    if (nuevoEstado === 'armado') textoAccion = 'Sistema armado totalmente';
    if (nuevoEstado === 'parcial') textoAccion = 'Modo Noche (Perímetro) activado';
    if (nuevoEstado === 'desarmado') textoAccion = 'Sistema desarmado';

    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: textoAccion }]);
  };

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 font-sans">
        <p className="text-neutral-400 animate-pulse">Sincronizando con FocusSafe...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 w-full max-w-7xl mx-auto font-sans flex flex-col lg:flex-row gap-8 lg:gap-12">
      
      {/* Columna Principal: Controles y Cámaras */}
      <div className="flex-1">
        <header className="mb-12">
          <h2 className="text-4xl font-light text-neutral-800 tracking-tight">{site?.nombre}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`w-2 h-2 rounded-full ${site?.estado_sistema === 'desarmado' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
            <p className="text-neutral-400">
              Sistema <span className="uppercase tracking-widest text-xs font-bold text-neutral-600 ml-1">{site?.estado_sistema}</span>
            </p>
          </div>
        </header>

        {/* Cámara en Vivo (La que acabamos de conectar) */}
        <section className="mb-10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">Cámaras de Seguridad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cámara 1: Real de MediaMTX */}
            <div className="bg-black rounded-[32px] border border-neutral-200 h-72 overflow-hidden relative group shadow-sm">
              <iframe
                src="http://localhost:8889/camara1"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
              ></iframe>
              <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-tighter animate-pulse shadow-lg">
                • En Vivo
              </div>
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg text-[11px] text-white/90 font-medium tracking-wide">
                Cámara Frontal
              </div>
            </div>

            {/* Cámara 2: Placeholder (Próximamente) */}
            <div className="bg-neutral-100 rounded-[32px] border border-neutral-200 h-72 flex flex-col items-center justify-center text-neutral-400 relative border-dashed">
              <div className="w-12 h-12 rounded-full border-2 border-neutral-200 flex items-center justify-center mb-2">
                <span className="text-xl">+</span>
              </div>
              <p className="text-xs uppercase tracking-widest font-semibold">Agregar Cámara</p>
            </div>
          </div>
        </section>

        {/* Tarjeta de Controles */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-neutral-100">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">Estado del Sistema</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => cambiarEstado('armado')}
              className={`py-8 rounded-3xl border transition-all duration-500 ${site?.estado_sistema === 'armado' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl scale-[1.02]' : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'}`}
            >
              <span className="block text-lg font-medium mb-1">Armar</span>
              <span className="text-[10px] uppercase tracking-widest opacity-60">Total</span>
            </button>
            
            <button 
              onClick={() => cambiarEstado('parcial')}
              className={`py-8 rounded-3xl border transition-all duration-500 ${site?.estado_sistema === 'parcial' ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl scale-[1.02]' : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'}`}
            >
              <span className="block text-lg font-medium mb-1">Noche</span>
              <span className="text-[10px] uppercase tracking-widest opacity-60">Perímetro</span>
            </button>
            
            <button 
              onClick={() => cambiarEstado('desarmado')}
              className={`py-8 rounded-3xl border transition-all duration-500 ${site?.estado_sistema === 'desarmado' ? 'bg-neutral-100 text-neutral-900 border-neutral-200 shadow-inner' : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'}`}
            >
              <span className="block text-lg font-medium mb-1">Desarmar</span>
              <span className="text-[10px] uppercase tracking-widest opacity-60">Seguro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Columna Lateral: Historial */}
      <aside className="w-full lg:w-96 bg-white rounded-[40px] shadow-sm border border-neutral-100 p-8 h-fit lg:sticky lg:top-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Actividad Reciente</h3>
          <span className="w-2 h-2 bg-neutral-200 rounded-full"></span>
        </div>
        
        <div className="space-y-6">
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">No hay actividad registrada.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-5 items-start">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)]"></div>
                <div>
                  <p className="text-sm font-medium text-neutral-800 leading-tight">{log.accion}</p>
                  <p className="text-[11px] text-neutral-400 mt-1 font-medium">{formatearFecha(log.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="w-full mt-10 py-4 border border-neutral-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-colors">
          Ver Historial Completo
        </button>
      </aside>

    </div>
  );
}