'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Search, Calendar, User, Bell, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import ReactPlayer from 'react-player';

// FIX ARQUITECTURA: Type casting para react-player
const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // Estado para la barra inferior

  // 1. Sincronización con Supabase
  useEffect(() => {
    setIsClient(true);

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

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;
    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);

    let texto = '';
    if (nuevoEstado === 'armado') texto = 'Sistema armado (Total)';
    if (nuevoEstado === 'parcial') texto = 'Modo noche activado';
    if (nuevoEstado === 'desarmado') texto = 'Sistema desarmado';

    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: texto }]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#F4F6F9]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-sans pb-28 md:pb-8 flex justify-center">
      
      {/* Contenedor principal estilo App */}
      <div className="w-full max-w-md bg-[#F4F6F9] min-h-screen relative flex flex-col">
        
        {/* Header Superior */}
        <header className="flex justify-between items-center p-6 pt-10">
          <div className="flex items-center gap-4 w-full">
            {/* Contenedor del logo: Exactamente el 20% del ancho para visibilidad móvil óptima */}
            <div className="w-[20%] flex-shrink-0">
              <img src="/logo-focus.png" alt="FocusSafe Logo" className="w-full h-auto object-contain drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 flex-1 tracking-tight">{site?.nombre || 'Mi Propiedad'}</h1>
            <button className="relative p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        <main className="px-6 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
          
          {/* Tarjeta de Video Principal (Estilo Media Player) */}
          <section className="relative w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-300/50">
            {isClient ? (
              <Player 
                url={site?.url_camara || "https://dinner-tomato-located-stake.trycloudflare.com/camara1/index.m3u8"}
                playing={true}
                muted={true}
                playsinline={true}
                width="100%"
                height="100%"
                style={{ objectFit: 'cover', filter: 'brightness(1.05) contrast(1.05)' }}
              />
            ) : (
              <div className="w-full h-full bg-slate-800 animate-pulse"></div>
            )}
            
            {/* Overlay de controles visuales */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
              <span className="text-[10px] text-white font-bold tracking-wider">LIVE FEED</span>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div>
                <p className="text-white font-medium text-sm drop-shadow-md">Cámara Principal</p>
                <p className="text-white/70 text-xs drop-shadow-md">Acceso Frontal</p>
              </div>
              <div className="flex gap-3 text-white">
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"><SkipBack size={16} fill="currentColor" /></button>
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"><Pause size={16} fill="currentColor" /></button>
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"><SkipForward size={16} fill="currentColor" /></button>
              </div>
            </div>
          </section>

          {/* Grilla de Estado Actual (Botonera) */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Current state</h2>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Botón Armado Total */}
              <button 
                onClick={() => cambiarEstado('armado')}
                className={`p-5 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-28 ${
                  site?.estado_sistema === 'armado' 
                  ? 'bg-slate-800 text-white shadow-xl shadow-slate-900/20 scale-[1.02]' 
                  : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Armado<br/>Total</span>
                  {site?.estado_sistema === 'armado' && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>}
                </div>
                <span className={`text-xs ${site?.estado_sistema === 'armado' ? 'text-slate-300' : 'text-slate-400'}`}>Máxima seg.</span>
              </button>

              {/* Botón Modo Noche */}
              <button 
                onClick={() => cambiarEstado('parcial')}
                className={`p-5 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-28 ${
                  site?.estado_sistema === 'parcial' 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                  : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50'
                }`}
              >
                 <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Modo<br/>Noche</span>
                  {site?.estado_sistema === 'parcial' && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>}
                </div>
                <span className={`text-xs ${site?.estado_sistema === 'parcial' ? 'text-indigo-200' : 'text-slate-400'}`}>Perímetro</span>
              </button>

              {/* Botón Desarmar */}
              <button 
                onClick={() => cambiarEstado('desarmado')}
                className={`col-span-2 p-5 rounded-[1.5rem] transition-all duration-300 flex items-center justify-between ${
                  site?.estado_sistema === 'desarmado' 
                  ? 'bg-white border-2 border-emerald-500 text-emerald-700 shadow-sm' 
                  : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-semibold block text-left">Desarmado</span>
                  <span className={`text-xs ${site?.estado_sistema === 'desarmado' ? 'text-emerald-600/70' : 'text-slate-400'}`}>Tránsito libre</span>
                </div>
                {site?.estado_sistema === 'desarmado' && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
              </button>
            </div>
          </section>

          {/* Historial Breve (Tipo Rooms) */}
          <section className="pb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Activity</h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ver todo</span>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5">
              {logs.slice(0, 3).map((log, i) => (
                <div key={log.id} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${log.accion.toLowerCase().includes('armado') ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">{log.accion}</p>
                    <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>

        {/* Barra de Navegación Inferior (Floating Mobile Nav) */}
        <nav className="fixed bottom-0 w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-8">
          <button onClick={() => setActiveTab('calendar')} className={`p-2 transition-colors ${activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Calendar size={24} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
          </button>
          <button onClick={() => setActiveTab('search')} className={`p-2 transition-colors ${activeTab === 'search' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
          </button>
          <button onClick={() => setActiveTab('home')} className={`relative p-2 transition-colors ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            {activeTab === 'home' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
          </button>
          <button onClick={() => setActiveTab('user')} className={`p-2 transition-colors ${activeTab === 'user' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={24} strokeWidth={activeTab === 'user' ? 2.5 : 2} />
          </button>
        </nav>

      </div>
    </div>
  );
}