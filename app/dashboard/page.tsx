'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Search, Calendar, User, Bell, Play, Pause, SkipForward, SkipBack, Settings, Video, List, ShieldAlert, Shield, ShieldCheck, Save } from 'lucide-react';
import ReactPlayer from 'react-player';

const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, cameras, activity, settings
  
  // Estados para la pestaña de configuración
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
        const { data: logsData } = await supabase.from('activity_logs').select('*').eq('site_id', siteData.id).order('created_at', { ascending: false }).limit(50);
        if (logsData) setLogs(logsData);
      }
      setLoading(false);
    };
    fetchData();

    const siteChannel = supabase.channel('cambios-sitios').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites' }, (payload) => setSite(payload.new)).subscribe();
    const logsChannel = supabase.channel('cambios-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => setLogs((current) => [payload.new, ...current].slice(0, 50))).subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!site || site.estado_sistema === nuevoEstado) return;
    await supabase.from('sites').update({ estado_sistema: nuevoEstado }).eq('id', site.id);
    let texto = nuevoEstado === 'armado' ? 'SISTEMA ARMADO (TOTAL)' : nuevoEstado === 'parcial' ? 'MODO NOCHE ACTIVADO' : 'SISTEMA DESARMADO';
    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: texto }]);
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await supabase.from('sites').update({ nombre: editNombre, url_camara: editUrl }).eq('id', site.id);
    await supabase.from('activity_logs').insert([{ site_id: site.id, accion: 'CONFIGURACIÓN DE SISTEMA ACTUALIZADA' }]);
    setGuardando(false);
    alert('Configuración guardada exitosamente');
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-screen bg-[#F4F6F9]"><div className="w-8 h-8 border-2 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;
  }

  // ---- VISTAS (Pestañas) ----
  const HomeView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section className="relative w-full aspect-video bg-[#0A192F] rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200">
          {isClient ? (
            <Player url={site?.url_camara || "https://branches-mostly-lcd-favour.trycloudflare.com/camara1/index.m3u8"} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} />
          ) : <div className="w-full h-full bg-slate-800 animate-pulse"></div>}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="text-[10px] text-white font-bold tracking-widest uppercase">Live</span>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Panel de Control</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => cambiarEstado('armado')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-600 border border-slate-200'}`}>
              <span className="font-bold text-left text-lg leading-tight">Armado<br/>Total</span>
              <span className="text-xs uppercase tracking-widest font-semibold opacity-60">Máxima Seg.</span>
            </button>
            <button onClick={() => cambiarEstado('parcial')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] shadow-xl scale-[1.02]' : 'bg-white text-slate-600 border border-slate-200'}`}>
              <span className="font-bold text-left text-lg leading-tight">Modo<br/>Noche</span>
              <span className="text-xs uppercase tracking-widest font-semibold opacity-60">Perímetro</span>
            </button>
            <button onClick={() => cambiarEstado('desarmado')} className={`p-6 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between h-32 ${site?.estado_sistema === 'desarmado' ? 'bg-white border-2 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
              <span className="font-bold text-left text-lg leading-tight">Desarmar<br/>Sistema</span>
              <span className="text-xs uppercase tracking-widest font-semibold opacity-60">Tránsito Libre</span>
            </button>
          </div>
        </section>
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 sticky top-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Actividad Reciente</h2>
          <div className="space-y-6">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${log.accion.includes('ARMADO') ? 'bg-[#0A192F]' : log.accion.includes('NOCHE') ? 'bg-[#D4AF37]' : 'bg-slate-200'}`}></div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-snug">{log.accion}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.created_at).toLocaleTimeString('es-CL')} • {new Date(log.created_at).toLocaleDateString('es-CL')}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('activity')} className="w-full mt-8 py-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100">Ver Historial Completo</button>
        </div>
      </aside>
    </div>
  );

  const CamerasView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-[#0A192F]">Circuito Cerrado (CCTV)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="aspect-video bg-[#0A192F] rounded-2xl overflow-hidden shadow-md relative">
           {isClient && <Player url={site?.url_camara} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} />}
           <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-white font-bold">CH1 - Frontal</div>
        </div>
        {/* Placeholder para más cámaras */}
        <div className="aspect-video bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-300 transition-colors cursor-pointer">
          <span className="text-4xl font-light mb-2">+</span>
          <span className="text-xs uppercase font-bold tracking-widest">Añadir IP Cam</span>
        </div>
      </div>
    </div>
  );

  const ActivityView = () => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#0A192F]">Historial del Sistema</h2>
        <button className="px-4 py-2 bg-[#0A192F] text-white text-xs font-bold uppercase tracking-widest rounded-lg">Descargar CSV</button>
      </div>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${log.accion.includes('ARMADO') ? 'bg-[#0A192F]' : log.accion.includes('NOCHE') ? 'bg-[#D4AF37]' : 'bg-emerald-500'}`}></div>
              <span className="text-sm font-semibold text-slate-700">{log.accion}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{new Date(log.created_at).toLocaleString('es-CL')}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="max-w-2xl bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-[#0A192F] mb-2">Configuración del Sitio</h2>
      <p className="text-slate-500 text-sm mb-8">Ajusta los parámetros operativos de la locación actual.</p>
      
      <form onSubmit={guardarConfiguracion} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Nombre de la Locación</label>
          <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:ring-2 focus:ring-[#0A192F]/20 focus:border-[#0A192F] outline-none transition-all" required />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">URL de Transmisión (HLS / m3u8)</label>
          <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://tunel.trycloudflare.com/camara1/index.m3u8" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:ring-2 focus:ring-[#0A192F]/20 focus:border-[#0A192F] outline-none transition-all" />
          <p className="text-[10px] text-slate-400 mt-2">Pega aquí el enlace de Cloudflare Tunnel u otro proveedor HLS.</p>
        </div>
        <button type="submit" disabled={guardando} className="mt-4 px-8 py-4 bg-[#D4AF37] text-[#0A192F] text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#c4a130] transition-all flex items-center gap-2">
          {guardando ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex">
      
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10"><img src="/logo-focus.png" alt="FS" className="w-full h-full object-contain" /></div>
          <span className="text-xl font-extralight tracking-tight text-[#0A192F]">FocusSafe</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'home', icon: Home, label: 'Inicio' },
            { id: 'cameras', icon: Video, label: 'Cámaras' },
            { id: 'activity', icon: List, label: 'Actividad' },
            { id: 'settings', icon: Settings, label: 'Configuración' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-[#0A192F] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pb-28 md:pb-12">
        {/* Header móvil */}
        <header className="md:hidden bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 w-3/4">
            <div className="w-[20%] max-w-[40px]"><img src="/logo-focus.png" alt="FS" className="w-full h-full object-contain" /></div>
            <h1 className="text-lg font-bold text-[#0A192F] truncate">{site?.nombre}</h1>
          </div>
          <Bell size={20} className="text-slate-400" />
        </header>

        {/* Header Escritorio */}
        <header className="hidden md:flex bg-white/50 backdrop-blur-sm border-b border-slate-100 px-12 py-6 justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">{activeTab === 'home' ? site?.nombre : activeTab === 'cameras' ? 'Cámaras' : activeTab === 'activity' ? 'Actividad' : 'Configuración'}</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Conexión Segura Activa</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm">ID: {site?.id?.substring(0,6)}</span>
          </div>
        </header>

        <div className="p-6 md:p-12 max-w-6xl mx-auto">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'cameras' && <CamerasView />}
          {activeTab === 'activity' && <ActivityView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* NAVBAR INFERIOR MÓVIL */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 pb-8">
        <button onClick={() => setActiveTab('home')} className={`p-2 transition-colors ${activeTab === 'home' ? 'text-[#0A192F]' : 'text-slate-400'}`}><Home size={24} /></button>
        <button onClick={() => setActiveTab('cameras')} className={`p-2 transition-colors ${activeTab === 'cameras' ? 'text-[#0A192F]' : 'text-slate-400'}`}><Video size={24} /></button>
        <button onClick={() => setActiveTab('activity')} className={`p-2 transition-colors ${activeTab === 'activity' ? 'text-[#0A192F]' : 'text-slate-400'}`}><List size={24} /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-[#0A192F]' : 'text-slate-400'}`}><Settings size={24} /></button>
      </nav>
    </div>
  );
}