'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Video, List, Settings, Bell, ShieldAlert, Shield, ShieldCheck, Save, Activity, Power } from 'lucide-react';
import ReactPlayer from 'react-player';

// Bypasseamos el conflicto de tipos de TypeScript
const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // URL MAESTRA ACTUALIZADA
  const URL_POR_DEFECTO = "https://regional-instructions-concert-curtis.trycloudflare.com/camara1/index.m3u8";

  const [editNombre, setEditNombre] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      const { data: siteData } = await supabase.from('sites').select('*').limit(1).single();
      if (siteData) {
        setSite(siteData);
        setEditNombre(siteData.nombre || '');
        setEditUrl(siteData.url_camara || '');
        const { data: logsData } = await supabase.from('activity_logs').select('*').eq('site_id', siteData.id).order('created_at', { ascending: false }).limit(20);
        if (logsData) setLogs(logsData);
      }
      setLoading(false);
    };
    fetchData();

    // Suscripción en tiempo real
    const siteChannel = supabase.channel('cambios-sitios').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, (payload) => setSite(payload.new)).subscribe();
    const logsChannel = supabase.channel('cambios-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => setLogs((current) => [payload.new, ...current].slice(0, 20))).subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const cambiarEstado = async (nuevoEstado: string, etiqueta: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;
    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);
    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: etiqueta.toUpperCase() }]);
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await supabase.from('sites').update({ nombre: editNombre, url_camara: editUrl }).eq('id', site.id);
    setGuardando(false);
    alert('Configuración sincronizada con FocusSafe Cloud');
  };

  if (loading) return <div className="h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-32">
      
      {/* HEADER CORPORATIVO (Sin menú lateral, centrado) */}
      <header className="bg-white border-b border-slate-100 px-6 py-8 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img src="/logo-focus.png" alt="FocusSafe Logo" className="h-10 md:h-14 w-auto object-contain" />
            <div className="hidden md:block h-8 w-[1px] bg-slate-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-black text-[#0A192F] tracking-tight">{site?.nombre || 'Mi Propiedad'}</h1>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Protegido
              </p>
            </div>
          </div>
          
          {/* Navegación Desktop integrada en Header */}
          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-[#0A192F]' : 'hover:text-[#0A192F] transition-colors'}>Inicio</button>
            <button onClick={() => setActiveTab('cameras')} className={activeTab === 'cameras' ? 'text-[#0A192F]' : 'hover:text-[#0A192F] transition-colors'}>Cámaras</button>
            <button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'text-[#0A192F]' : 'hover:text-[#0A192F] transition-colors'}>Actividad</button>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-[#0A192F]' : 'hover:text-[#0A192F] transition-colors'}>Configuración</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#0A192F]">
              <Bell size={24} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* COLUMNA VIDEO Y BOTONES */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* VIDEO LIVE FEED */}
              <section className="relative aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white">
                {isClient ? (
                  <Player 
                    url={site?.url_camara || URL_POR_DEFECTO} 
                    playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} 
                  />
                ) : <div className="w-full h-full bg-slate-900 animate-pulse"></div>}
                <div className="absolute top-6 left-6 bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">En Vivo</span>
                </div>
              </section>

              {/* BOTONERA MAESTRA */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-[#0A192F] uppercase tracking-tighter">Panel de Control</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* ARMADO TOTAL */}
                  <button onClick={() => cambiarEstado('armado', 'Armado Total - Máxima Seg.')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                    <ShieldAlert size={44} className={site?.estado_sistema === 'armado' ? 'text-[#D4AF37]' : 'text-slate-200'} />
                    <div className="text-left">
                      <span className="block text-xl font-bold leading-tight">Armado<br/>Total</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Máxima Seg.</span>
                    </div>
                  </button>

                  {/* MODO NOCHE */}
                  <button onClick={() => cambiarEstado('parcial', 'Modo Noche - Perímetro')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] border-[#D4AF37] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                    <Shield size={44} className={site?.estado_sistema === 'parcial' ? 'text-[#0A192F]' : 'text-slate-200'} />
                    <div className="text-left">
                      <span className="block text-xl font-bold leading-tight">Modo<br/>Noche</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Perímetro</span>
                    </div>
                  </button>

                  {/* DESARMAR */}
                  <button onClick={() => cambiarEstado('desarmado', 'Sistema Desarmado - Tránsito Libre')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'desarmado' ? 'bg-white border-emerald-500 text-emerald-700 shadow-xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                    <ShieldCheck size={44} className={site?.estado_sistema === 'desarmado' ? 'text-emerald-500' : 'text-slate-200'} />
                    <div className="text-left">
                      <span className="block text-xl font-bold leading-tight">Desarmar<br/>Sistema</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Tránsito Libre</span>
                    </div>
                  </button>

                </div>
              </section>
            </div>

            {/* SIDEBAR DERECHA - REGISTRO DE ACTIVIDAD */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 sticky top-32">
                <h3 className="text-xs font-black text-[#0A192F] mb-10 uppercase tracking-[0.3em]">Registro Maestro</h3>
                <div className="space-y-8">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex gap-5 items-start relative">
                      <div className="absolute left-[6px] top-7 bottom-[-32px] w-[1px] bg-slate-100 last:hidden"></div>
                      <div className={`w-3 h-3 rounded-full mt-1.5 border-2 bg-white ${log.accion.includes('ARMADO') ? 'border-[#0A192F]' : log.accion.includes('NOCHE') ? 'border-[#D4AF37]' : 'border-emerald-500'}`}></div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">{log.accion}</p>
                        <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-tighter">
                          {new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('activity')} className="w-full mt-12 py-4 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#0A192F] hover:text-white transition-all">Ver Historial Completo</button>
              </div>
            </aside>
          </div>
        )}

        {/* VISTAS SPA */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[4rem] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl font-black text-[#0A192F] mb-2 tracking-tighter">Configuración</h2>
            <p className="text-slate-400 text-sm mb-10">Administración de protocolos y puntos de enlace.</p>
            <form onSubmit={guardarConfiguracion} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre de la Ubicación</label>
                <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5 font-medium transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Endpoint HLS (Cloudflare Tunnel)</label>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5 font-medium transition-all" />
              </div>
              <button type="submit" disabled={guardando} className="w-full py-6 bg-[#D4AF37] text-[#0A192F] text-[11px] font-black uppercase tracking-widest rounded-3xl hover:shadow-2xl transition-all flex items-center justify-center gap-3">
                <Save size={18}/> {guardando ? 'Sincronizando...' : 'Guardar y Activar Sistema'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'cameras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-video bg-black rounded-[3rem] overflow-hidden relative border-[6px] border-white shadow-2xl">
              <Player url={site?.url_camara || URL_POR_DEFECTO} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} />
              <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-5 py-2 rounded-2xl text-[10px] text-white font-black uppercase tracking-widest">Canal 01 - Main Stream</div>
            </div>
            <button onClick={() => setActiveTab('settings')} className="aspect-video bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:border-slate-200 hover:text-slate-400 transition-all">
              <span className="text-5xl font-light">+</span>
              <span className="text-[10px] font-black uppercase tracking-widest mt-4">Vincular Nueva Cámara</span>
            </button>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm max-w-4xl mx-auto">
            <h2 className="text-2xl font-black mb-10 text-[#0A192F] tracking-tighter uppercase">Historial Maestro de Eventos</h2>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex justify-between items-center py-5 px-6 rounded-2xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${log.accion.includes('ARMADO') ? 'bg-[#0A192F]' : log.accion.includes('NOCHE') ? 'bg-[#D4AF37]' : 'bg-emerald-500'}`}></div>
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-tight">{log.accion}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-black">{new Date(log.created_at).toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* NAVBAR MÓVIL (Sticky bottom) */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-8 py-6 flex justify-between items-center z-50 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] pb-10">
        <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Home size={28} /></button>
        <button onClick={() => setActiveTab('cameras')} className={`p-3 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Video size={28} /></button>
        <button onClick={() => setActiveTab('activity')} className={`p-3 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><List size={28} /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Settings size={28} /></button>
      </nav>
    </div>
  );
}