'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Search, Calendar, User, Bell, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import ReactPlayer from 'react-player';

const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      const { data: siteData } = await supabase.from('sites').select('*').limit(1).single();
      if (siteData) {
        setSite(siteData);
        const { data: logsData } = await supabase.from('activity_logs').select('*').eq('site_id', siteData.id).order('created_at', { ascending: false }).limit(10);
        if (logsData) setLogs(logsData);
      }
      setLoading(false);
    };
    fetchData();

    const siteChannel = supabase.channel('cambios-sitios').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, (payload) => setSite(payload.new)).subscribe();
    const logsChannel = supabase.channel('cambios-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => setLogs((current) => [payload.new, ...current].slice(0, 10))).subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;
    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);
    let texto = nuevoEstado === 'armado' ? 'Sistema armado (Total)' : nuevoEstado === 'parcial' ? 'Modo noche activado' : 'Sistema desarmado';
    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: texto }]);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-screen bg-[#F4F6F9]"><div className="w-8 h-8 border-2 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-sans pb-28 md:pb-12">
      
      {/* Header Responsivo */}
      <header className="bg-white border-b border-slate-100 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
              <img src="/logo-focus.png" alt="FocusSafe Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#0A192F] tracking-tight">{site?.nombre || 'Mi Propiedad'}</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Conexión Segura Activa</p>
            </div>
          </div>
          <button className="relative p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-[#0A192F]" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Grid Principal: 1 columna en móvil, 3 columnas en escritorio */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda/Central: Video y Controles (Más ancha en PC) */}
        <div className="lg:col-span-2 space-y-8">
          
          <section className="relative w-full aspect-video bg-[#0A192F] rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200">
            {isClient ? (
              <Player 
                url={site?.url_camara || "https://dinner-tomato-located-stake.trycloudflare.com/camara1/index.m3u8"}
                playing={true} muted={true} playsinline={true} width="100%" height="100%"
                style={{ objectFit: 'cover', filter: 'brightness(1.05) contrast(1.05)' }}
              />
            ) : <div className="w-full h-full bg-slate-800 animate-pulse"></div>}
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span className="text-[10px] text-white font-bold tracking-widest uppercase">Live Feed</span>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div>
                <p className="text-white font-semibold md:text-lg drop-shadow-md">Cámara Principal</p>
                <p className="text-[#D4AF37] text-xs font-medium tracking-wide uppercase drop-shadow-md mt-1">Acceso Frontal</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Panel de Control</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => cambiarEstado('armado')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white shadow-xl scale-[1.02] border border-[#0A192F]' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex justify-between w-full">
                  <span className="font-bold text-left text-lg leading-tight">Armado<br/>Total</span>
                  {site?.estado_sistema === 'armado' && <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-1 shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>}
                </div>
                <span className={`text-xs uppercase tracking-widest font-semibold ${site?.estado_sistema === 'armado' ? 'text-slate-400' : 'text-slate-400'}`}>Máxima Seg.</span>
              </button>
              <button onClick={() => cambiarEstado('parcial')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] shadow-xl scale-[1.02] border border-[#D4AF37]' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                 <div className="flex justify-between w-full">
                  <span className="font-bold text-left text-lg leading-tight">Modo<br/>Noche</span>
                  {site?.estado_sistema === 'parcial' && <div className="w-2 h-2 bg-white rounded-full mt-1"></div>}
                </div>
                <span className={`text-xs uppercase tracking-widest font-semibold ${site?.estado_sistema === 'parcial' ? 'text-[#0A192F]/70' : 'text-slate-400'}`}>Perímetro</span>
              </button>
              <button onClick={() => cambiarEstado('desarmado')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'desarmado' ? 'bg-white border-2 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex justify-between w-full">
                  <span className="font-bold text-left text-lg leading-tight">Desarmar<br/>Sistema</span>
                  {site?.estado_sistema === 'desarmado' && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1 animate-pulse"></div>}
                </div>
                <span className={`text-xs uppercase tracking-widest font-semibold ${site?.estado_sistema === 'desarmado' ? 'text-emerald-600/70' : 'text-slate-400'}`}>Tránsito Libre</span>
              </button>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Historial y Configuración (Sticky en PC) */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 sticky top-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Registro de Actividad</h2>
            </div>
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${log.accion.toLowerCase().includes('armado') ? 'bg-[#0A192F]' : log.accion.toLowerCase().includes('noche') ? 'bg-[#D4AF37]' : 'bg-slate-200'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 leading-snug">{log.accion}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">{new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">
              Descargar Reporte
            </button>
          </div>
        </aside>
      </main>

      {/* Navegación Inferior SOLO PARA CELULARES (Se oculta en Desktop) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-8">
        <button onClick={() => setActiveTab('calendar')} className={`p-2 transition-colors ${activeTab === 'calendar' ? 'text-[#0A192F]' : 'text-slate-400'}`}><Calendar size={24} /></button>
        <button onClick={() => setActiveTab('search')} className={`p-2 transition-colors ${activeTab === 'search' ? 'text-[#0A192F]' : 'text-slate-400'}`}><Search size={24} /></button>
        <button onClick={() => setActiveTab('home')} className={`relative p-2 transition-colors ${activeTab === 'home' ? 'text-[#0A192F]' : 'text-slate-400'}`}>
          <Home size={24} />
          {activeTab === 'home' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>}
        </button>
        <button onClick={() => setActiveTab('user')} className={`p-2 transition-colors ${activeTab === 'user' ? 'text-[#0A192F]' : 'text-slate-400'}`}><User size={24} /></button>
      </nav>

    </div>
  );
}