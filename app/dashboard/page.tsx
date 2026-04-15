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
      // Obtener el sitio
      const { data: siteData } = await supabase.from('sites').select('*').limit(1).single();
      if (siteData) {
        setSite(siteData);
        // Obtener el historial de ese sitio (últimos 10 eventos)
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

    // Suscripción al Sitio
    const siteChannel = supabase
      .channel('cambios-sitios')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, 
      (payload) => {
        setSite(payload.new);
      })
      .subscribe();

    // Suscripción a los Logs (Historial)
    const logsChannel = supabase
      .channel('cambios-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, 
      (payload) => {
        // Agrega el nuevo evento al principio de la lista visualmente
        setLogs((currentLogs) => [payload.new, ...currentLogs].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  // 2. Enviar la orden a la base de datos
  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return; // Evita registrar el mismo estado 2 veces

    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);

    let textoAccion = '';
    if (nuevoEstado === 'armado') textoAccion = 'Sistema armado totalmente';
    if (nuevoEstado === 'parcial') textoAccion = 'Modo Noche (Perímetro) activado';
    if (nuevoEstado === 'desarmado') textoAccion = 'Sistema desarmado';

    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: textoAccion }]);
  };

  // Función para darle formato limpio a la fecha
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
    <div className="p-6 md:p-12 w-full max-w-6xl mx-auto font-sans flex flex-col lg:flex-row gap-8 lg:gap-12">
      
      {/* Columna Principal: Controles y Cámaras */}
      <div className="flex-1">
        <header className="mb-12">
          <h2 className="text-3xl font-light text-neutral-800 tracking-tight">{site?.nombre}</h2>
          <p className="text-neutral-400 mt-1">
            Estado actual: <span className="uppercase tracking-widest text-xs font-semibold text-neutral-600 ml-1">{site?.estado_sistema}</span>
          </p>
        </header>

        {/* Tarjeta Central de Botones */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-neutral-100 mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">Control de Alarma</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => cambiarEstado('armado')}
              className={`py-8 rounded-2xl border transition-all duration-300 ${site?.estado_sistema === 'armado' ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
            >
              <span className="block text-lg mb-1">Armado Total</span>
              <span className="text-xs opacity-70">Todas las zonas</span>
            </button>
            
            <button 
              onClick={() => cambiarEstado('parcial')}
              className={`py-8 rounded-2xl border transition-all duration-300 ${site?.estado_sistema === 'parcial' ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
            >
              <span className="block text-lg mb-1">Modo Noche</span>
              <span className="text-xs opacity-70">Perímetro</span>
            </button>
            
            <button 
              onClick={() => cambiarEstado('desarmado')}
              className={`py-8 rounded-2xl border transition-all duration-300 ${site?.estado_sistema === 'desarmado' ? 'bg-neutral-100 text-neutral-900 border-neutral-200 shadow-inner' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
            >
              <span className="block text-lg mb-1">Desarmar</span>
              <span className="text-xs opacity-70">Inactivo</span>
            </button>
          </div>
        </div>

        {/* Marcador de Cámaras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-neutral-50 rounded-3xl border border-neutral-100 h-56 flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Feed de Video 1 (Pendiente)</p>
          </div>
          <div className="bg-neutral-50 rounded-3xl border border-neutral-100 h-56 flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Feed de Video 2 (Pendiente)</p>
          </div>
        </div>
      </div>

      {/* Columna Lateral: Historial de Actividad */}
      <aside className="w-full lg:w-80 bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 h-fit flex flex-col">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">Registro de Accesos</h3>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">No hay actividad reciente.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start border-b border-neutral-50 pb-4 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-neutral-200 shrink-0"></div>
                <div>
                  <p className="text-sm text-neutral-700">{log.accion}</p>
                  <p className="text-xs text-neutral-400 mt-1">{formatearFecha(log.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

    </div>
  );
}