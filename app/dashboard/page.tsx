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
  
  // URL MAESTRA (La que me pasaste)
  const URL_POR_DEFECTO = "https://dom-information-enhancing-oct.trycloudflare.com/camara1/index.m3u8";

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
    alert('Configuración sincronizada con la nube');
  };

  if (loading) return <div className="h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0A192F] text-white h-screen sticky top-0 p-8">
        <div className="flex items-center gap-4 mb-12">
          <img src="/logo-focus.png" alt="FocusSafe" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
          <span className="text-2xl font-bold tracking-tighter">FocusSafe</span>
        </div>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#D4AF37] text-[#0A192F] font-bold' : 'text-slate-400 hover:bg-white/5'}`}><Home size={20}/> Inicio</button>
          <button onClick={() => setActiveTab('cameras')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#D4AF37] text-[#0A192F] font-bold' : 'text-slate-400 hover:bg-white/5'}`}><Video size={20}/> Cámaras</button>
          <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#D4AF37] text-[#0A192F] font-bold' : 'text-slate-400 hover:bg-white/5'}`}><List size={20}/> Actividad</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#D4AF37] text-[#0A192F] font-bold' : 'text-slate-400 hover:bg-white/5'}`}><Settings size={20}/> Configuración</button>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 pb-32 lg:pb-12">
        <header className="bg-white/80 border-b border-slate-100 px-8 lg:px-16 py-8 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-black text-[#0A192F] tracking-tight">{activeTab === 'home' ? site?.nombre : activeTab.toUpperCase()}</h1>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Online
            </p>
          </div>
          <Bell size={24} className="text-[#0A192F]" />
        </header>

        <div className="px-6 lg:px-16 py-10 max-w-7xl mx-auto">
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 space-y-10">
                
                {/* VIDEO CON TU LINK NUEVO */}
                <section className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white">
                  {isClient ? (
                    <Player 
                      url={site?.url_camara || URL_POR_DEFECTO} 
                      playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} 
                    />
                  ) : <div className="w-full h-full bg-slate-900 animate-pulse"></div>}
                  <div className="absolute top-6 left-6 bg-red-600 px-4 py-1.5 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Live</span>
                  </div>
                </section>

                {/* BOTONERA 100% FUNCIONAL */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => cambiarEstado('armado', 'Armado Total - Máxima Seg.')} className={`p-8 rounded-[2rem] transition-all flex flex-col justify-between h-48 border-2 ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                    <ShieldAlert size={36} className={site?.estado_sistema === 'armado' ? 'text-[#D4AF37]' : 'text-slate-300'} />
                    <div className="text-left"><span className="block text-xl font-bold leading-tight">Armado<br/>Total</span><span className="text-[9px] font-black uppercase opacity-50">Máxima Seg.</span></div>
                  </button>

                  <button onClick={() => cambiarEstado('parcial', 'Modo Noche - Perímetro')} className={`p-8 rounded-[2rem] transition-all flex flex-col justify-between h-48 border-2 ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] border-[#D4AF37] shadow-2xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                    <Shield size={36} className={site?.estado_sistema === 'parcial' ? 'text-[#0A192F]' : 'text-slate-300'} />
                    <div className="text-left"><span className="block text-xl font-bold leading-tight">Modo<br/>Noche</span><span className="text-[9px] font-black uppercase opacity-60">Perímetro</span></div>
                  </button>

                  <button onClick={() => cambiarEstado('desarmado', 'Sistema Desarmado - Tránsito Libre')} className={`p-8 rounded-[2rem] transition-all flex flex-col justify-between h-48 border-2 ${site?.estado_sistema === 'desarmado' ? 'bg-white border-emerald-500 text-emerald-700 shadow-xl scale-[1.03]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                    <ShieldCheck size={36} className={site?.estado_sistema === 'desarmado' ? 'text-emerald-500' : 'text-slate-300'} />
                    <div className="text-left"><span className="block text-xl font-bold leading-tight">Desarmar<br/>Sistema</span><span className="text-[9px] font-black uppercase opacity-60">Tránsito Libre</span></div>
                  </button>
                </section>
              </div>

              {/* Sidebar Derecha - Historial */}
              <aside className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit sticky top-32">
                <h3 className="text-lg font-black text-[#0A192F] mb-8 flex items-center justify-between">Historial <Activity size={18} className="text-[#D4AF37]"/></h3>
                <div className="space-y-6">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex gap-4 items-start border-l-2 border-slate-50 pl-4">
                      <div>
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">{log.accion}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{new Date(log.created_at).toLocaleTimeString('es-CL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {/* VISTA PARA AGREGAR/CONFIGURAR CÁMARAS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-12 rounded-[3rem] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl font-black text-[#0A192F] mb-8">Configuración Maestra</h2>
              <form onSubmit={guardarConfiguracion} className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre de la Propiedad</label>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 mt-2 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Link de la Cámara (Para agregar/cambiar)</label>
                  <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 mt-2 text-slate-700 outline-none focus:ring-4 focus:ring-[#0A192F]/5" />
                  <p className="text-[10px] text-slate-400 mt-2 px-2 italic">Aquí es donde "agregas" el video de Cloudflare.</p>
                </div>
                <button type="submit" disabled={guardando} className="px-12 py-5 bg-[#D4AF37] text-[#0A192F] text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all flex items-center gap-3">
                  <Save size={18}/> {guardando ? 'Sincronizando...' : 'Guardar y Activar'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'cameras' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden relative border-[6px] border-white shadow-2xl">
                <Player url={site?.url_camara || URL_POR_DEFECTO} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] text-white font-black uppercase tracking-widest">Cámara 01</div>
              </div>
              <button onClick={() => setActiveTab('settings')} className="aspect-video bg-slate-100 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">
                <span className="text-4xl font-light">+</span>
                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Configurar Nueva Cámara</span>
              </button>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-sm">
              <h2 className="text-2xl font-black mb-8 text-[#0A192F]">Registro Completo de Actividad</h2>
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                    <span className="font-bold text-slate-700 text-sm">{log.accion}</span>
                    <span className="text-[10px] text-slate-400 font-black">{new Date(log.created_at).toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NAVBAR MÓVIL */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-8 py-6 flex justify-between items-center z-50 rounded-t-[2.5rem] pb-10">
        <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Home size={28} /></button>
        <button onClick={() => setActiveTab('cameras')} className={`p-3 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Video size={28} /></button>
        <button onClick={() => setActiveTab('activity')} className={`p-3 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><List size={28} /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#0A192F] text-white shadow-lg' : 'text-slate-300'}`}><Settings size={28} /></button>
      </nav>
    </div>
  );
}