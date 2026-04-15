'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Video, List, Settings, Bell, ShieldAlert, Shield, ShieldCheck, Save, Activity, Power, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';

const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [editNombre, setEditNombre] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  // 1. Sincronización Real con Supabase
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
    alert('Sistema Sincronizado');
  };

  if (loading) return <div className="h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-32">
      
      {/* HEADER PREMIUM (Centrado y con Logo Proporcional) */}
      <header className="bg-white border-b border-slate-100 px-6 py-8 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 w-full max-w-[250px]">
            {/* Logo: Importancia de marca según instrucciones */}
            <img src="/logo-focus.png" alt="FocusSafe Logo" className="w-[40%] h-auto object-contain" />
          </div>
          
          <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-[#0A192F]' : 'hover:text-slate-600'}>Inicio</button>
            <button onClick={() => setActiveTab('cameras')} className={activeTab === 'cameras' ? 'text-[#0A192F]' : 'hover:text-slate-600'}>Cámaras</button>
            <button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'text-[#0A192F]' : 'hover:text-slate-600'}>Actividad</button>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-[#0A192F]' : 'hover:text-slate-600'}>Configuración</button>
          </div>

          <div className="flex items-center gap-4">
            <Bell size={24} className="text-[#0A192F] cursor-pointer" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10">
        
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            <div className="lg:col-span-8 space-y-10">
              {/* VIDEO LIVE */}
              <section className="relative aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white">
                {isClient ? (
                  <Player 
                    url={site?.url_camara || "https://dom-information-enhancing-oct.trycloudflare.com/camara1/index.m3u8"} 
                    playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} 
                  />
                ) : <div className="w-full h-full bg-slate-900 animate-pulse"></div>}
                <div className="absolute top-6 left-6 bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">En Vivo</span>
                </div>
              </section>

              {/* BOTONERA SOLICITADA - 100% FUNCIONAL */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* ARMADO TOTAL */}
                <button onClick={() => cambiarEstado('armado', 'Armado Total - Máxima Seg.')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                  <ShieldAlert size={40} className={site?.estado_sistema === 'armado' ? 'text-[#D4AF37]' : 'text-slate-300'} />
                  <div className="text-left">
                    <span className="block text-xl font-bold leading-tight">Armado<br/>Total</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Máxima Seg.</span>
                  </div>
                </button>

                {/* MODO NOCHE */}
                <button onClick={() => cambiarEstado('parcial', 'Modo Noche - Perímetro')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] border-[#D4AF37] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                  <Shield size={40} className={site?.estado_sistema === 'parcial' ? 'text-[#0A192F]' : 'text-slate-300'} />
                  <div className="text-left">
                    <span className="block text-xl font-bold leading-tight">Modo<br/>Noche</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Perímetro</span>
                  </div>
                </button>

                {/* DESARMAR */}
                <button onClick={() => cambiarEstado('desarmado', 'Sistema Desarmado - Tránsito Libre')} className={`p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between h-52 border-2 ${site?.estado_sistema === 'desarmado' ? 'bg-white border-emerald-500 text-emerald-700 shadow-xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                  <ShieldCheck size={40} className={site?.estado_sistema === 'desarmado' ? 'text-emerald-500' : 'text-slate-300'} />
                  <div className="text-left">
                    <span className="block text-xl font-bold leading-tight">Desarmar<br/>Sistema</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Tránsito Libre</span>
                  </div>
                </button>

              </section>
            </div>

            {/* SIDEBAR DERECHA - REGISTRO */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-[#0A192F] mb-8 uppercase tracking-[0.2em]">Registro de Eventos</h3>
                <div className="space-y-8">
                  {logs.slice(0, 4).map((log) => (
                    <div key={log.id} className="flex gap-4 items-start relative">
                      <div className="absolute left-[5px] top-6 bottom-[-32px] w-[2px] bg-slate-50 last:hidden"></div>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${log.accion.includes('ARMADO') ? 'bg-[#0A192F]' : log.accion.includes('NOCHE') ? 'bg-[#D4AF37]' : 'bg-emerald-500'}`}></div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-800 leading-tight">{log.accion}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{new Date(log.created_at).toLocaleTimeString('es-CL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* VISTA DE CONFIGURACIÓN (Oculta hasta presionar botón) */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl font-black text-[#0A192F] mb-4">Configuración</h2>
            <p className="text-slate-400 text-sm mb-10 font-medium">Administra los puntos de enlace y nombres del sistema.</p>
            
            <form onSubmit={guardarConfiguracion} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0A192F] ml-2">Nombre del Sitio</label>
                <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5 font-medium transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0A192F] ml-2">URL de Cámara (Cloudflare Tunnel)</label>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5 font-medium transition-all" />
                <p className="text-[10px] text-slate-400 italic px-2">Recuerda incluir /camara1/index.m3u8 al final.</p>
              </div>
              <button type="submit" disabled={guardando} className="w-full py-5 bg-[#D4AF37] text-[#0A192F] text-[11px] font-black uppercase tracking-widest rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center gap-3">
                <Save size={18}/> {guardando ? 'Sincronizando...' : 'Guardar y Activar'}
              </button>
            </form>
          </div>
        )}

        {/* VISTAS EXTRAS */}
        {activeTab === 'cameras' && <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="aspect-video bg-black rounded-[3rem] overflow-hidden relative border-[6px] border-white shadow-2xl"><Player url={site?.url_camara} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} /><div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] text-white font-black uppercase tracking-widest">CH01 - Main Stream</div></div></div>}
        {activeTab === 'activity' && <div className="bg-white p-12 rounded-[3rem] shadow-sm"><h2 className="text-2xl font-black mb-8 text-[#0A192F]">Historial Maestro</h2><div className="space-y-4">{logs.map(log => (<div key={log.id} className="flex justify-between items-center py-5 border-b border-slate-50"><span className="font-bold text-slate-700 text-sm">{log.accion}</span><span className="text-[10px] text-slate-400 font-black">{new Date(log.created_at).toLocaleString('es-CL')}</span></div>))}</div></div>}

      </main>

      {/* NAVBAR MÓVIL (Sticky bottom para experiencia App) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-8 py-6 flex justify-between items-center z-50 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] pb-10">
        <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Home size={28} /></button>
        <button onClick={() => setActiveTab('cameras')} className={`p-3 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Video size={28} /></button>
        <button onClick={() => setActiveTab('activity')} className={`p-3 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><List size={28} /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Settings size={28} /></button>
      </nav>
    </div>
  );
}