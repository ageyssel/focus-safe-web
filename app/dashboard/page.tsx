'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Shield, ShieldAlert, ShieldCheck, Video, Clock, Zap, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Sincronización con Supabase (Datos y Tiempo Real)
  useEffect(() => {
    const fetchData = async () => {
      // Obtener datos iniciales del sitio
      const { data: siteData } = await supabase.from('sites').select('*').limit(1).single();
      if (siteData) {
        setSite(siteData);
        // Obtener historial reciente
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

    // Canales de tiempo real
    const siteChannel = supabase
      .channel('cambios-sitios')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, 
      (payload) => setSite(payload.new))
      .subscribe();

    const logsChannel = supabase
      .channel('cambios-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, 
      (payload) => setLogs((current) => [payload.new, ...current].slice(0, 10)))
      .subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  // 2. Control de Alarma
  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;

    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);

    let texto = '';
    if (nuevoEstado === 'armado') texto = '🛡️ SISTEMA ARMADO (TOTAL)';
    if (nuevoEstado === 'parcial') texto = '🌙 MODO NOCHE ACTIVADO';
    if (nuevoEstado === 'desarmado') texto = '✅ SISTEMA DESARMADO';

    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: texto }]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">FocusSafe | Intelligence</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUMNA IZQUIERDA: MONITOREO */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Header Profesional con Logo */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-neutral-200 gap-6">
            <div className="flex items-center gap-6">
              {/* Logo: Escalado al 20% del contenedor para minimalismo */}
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center p-3">
                <img 
                  src="/logo-focus.png" 
                  alt="FocusSafe" 
                  className="w-full h-full object-contain opacity-90"
                />
              </div>
              <div>
                <h1 className="text-4xl font-extralight tracking-tighter text-neutral-800">{site?.nombre}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Activity size={12} className="text-green-500" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-bold">Secure Connection Active</p>
                </div>
              </div>
            </div>
            
            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-colors duration-500 ${
              site?.estado_sistema === 'armado' 
              ? 'bg-red-50 border-red-100 text-red-600' 
              : 'bg-green-50 border-green-100 text-green-600'
            }`}>
              {site?.estado_sistema === 'armado' ? '● System Armed' : '● System Disarmed'}
            </div>
          </header>

          {/* Grilla de Video-Vigilancia */}
          <section>
            <div className="flex items-center gap-3 mb-6 text-neutral-500">
              <Video size={18} strokeWidth={1.5} />
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold">Visual Intelligence</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cámara 1: Feed Real vía MediaMTX */}
              <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white relative group">
                <iframe 
                  src="https://dinner-tomato-located-stake.trycloudflare.com/camara1" 
                  className="w-full h-full border-0 grayscale-[0.1] contrast-110" 
                />
                <div className="absolute top-5 left-5 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  <span className="text-[9px] text-white font-black uppercase tracking-tighter">Live</span>
                </div>
                <div className="absolute bottom-5 left-5 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] text-white/90 font-medium">
                  CÁMARA PRINCIPAL
                </div>
              </div>

              {/* Cámara 2: Placeholder de Expansión */}
              <div className="aspect-video bg-neutral-200/40 border-2 border-dashed border-neutral-300 rounded-[2.5rem] flex flex-col items-center justify-center group hover:bg-neutral-200/60 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <span className="text-neutral-300 text-2xl font-light">+</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-4">Añadir Periférico</p>
              </div>
            </div>
          </section>

          {/* Panel de Mandos Estilo "Tactile" */}
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-neutral-100">
            <div className="flex items-center gap-3 mb-8 text-neutral-500">
              <Zap size={18} strokeWidth={1.5} />
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold">Security Commands</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <button 
                onClick={() => cambiarEstado('armado')} 
                className={`group p-10 rounded-[2rem] transition-all duration-700 ${
                  site?.estado_sistema === 'armado' 
                  ? 'bg-red-600 text-white shadow-2xl shadow-red-200 scale-[1.02]' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <ShieldAlert className={`mb-4 transition-transform ${site?.estado_sistema === 'armado' ? 'scale-110' : 'opacity-40'}`} size={28} strokeWidth={1} />
                <span className="block text-xl font-light mb-1">Armar Total</span>
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">Protección Máxima</span>
              </button>

              <button 
                onClick={() => cambiarEstado('parcial')} 
                className={`group p-10 rounded-[2rem] transition-all duration-700 ${
                  site?.estado_sistema === 'parcial' 
                  ? 'bg-neutral-900 text-white shadow-2xl scale-[1.02]' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <Shield className={`mb-4 transition-transform ${site?.estado_sistema === 'parcial' ? 'scale-110' : 'opacity-40'}`} size={28} strokeWidth={1} />
                <span className="block text-xl font-light mb-1">Modo Noche</span>
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">Perímetro Activo</span>
              </button>

              <button 
                onClick={() => cambiarEstado('desarmado')} 
                className={`group p-10 rounded-[2rem] transition-all duration-700 ${
                  site?.estado_sistema === 'desarmado' 
                  ? 'bg-white border-2 border-green-500 text-green-600 shadow-inner' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <ShieldCheck className={`mb-4 transition-transform ${site?.estado_sistema === 'desarmado' ? 'scale-110' : 'opacity-100'}`} size={28} strokeWidth={1} />
                <span className="block text-xl font-light mb-1">Desarmar</span>
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">Acceso Libre</span>
              </button>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: LOGS */}
        <aside className="lg:col-span-4 h-fit">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-neutral-100 lg:sticky lg:top-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3 text-neutral-500">
                <Clock size={18} strokeWidth={1.5} />
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold">Activity Log</h3>
              </div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-8">
              {logs.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">No activity detected.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="group flex gap-5 items-start relative">
                    {/* Línea de tiempo visual */}
                    <div className="absolute left-[7px] top-7 bottom-[-35px] w-[1px] bg-neutral-100 group-last:hidden"></div>
                    
                    <div className={`w-3.5 h-3.5 mt-1 rounded-full border-2 bg-white z-10 transition-colors duration-500 ${
                      log.accion.includes('ARMADO') ? 'border-red-500' : 'border-neutral-900'
                    }`}></div>
                    
                    <div>
                      <p className="text-[13px] font-medium text-neutral-800 leading-snug">{log.accion}</p>
                      <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-tighter">
                        {new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button className="w-full mt-12 py-5 rounded-[1.5rem] bg-neutral-50 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all duration-300">
              View History
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}