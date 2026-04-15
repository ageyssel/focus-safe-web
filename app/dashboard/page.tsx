'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Home, Video, List, Settings, Bell, ShieldAlert, Shield, ShieldCheck, Save, Activity, Power } from 'lucide-react';
import ReactPlayer from 'react-player';

const Player = ReactPlayer as any;

export default function DashboardPage() {
  const [site, setSite] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Estados para configuración
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
    alert('Sistema actualizado');
  };

  if (loading) return <div className="h-screen bg-[#F4F6F9] flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A192F] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0A192F] text-white h-screen sticky top-0 p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <img src="/logo-focus.png" alt="FocusSafe" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
          <span className="text-2xl font-bold tracking-tighter">FocusSafe</span>
        </div>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#D4AF37] text-[#0A192F] font-bold shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}><Home size={20}/> Inicio</button>
          <button onClick={() => setActiveTab('cameras')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#D4AF37] text-[#0A192F] font-bold shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}><Video size={20}/> Cámaras</button>
          <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#D4AF37] text-[#0A192F] font-bold shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}><List size={20}/> Actividad</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#D4AF37] text-[#0A192F] font-bold shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}><Settings size={20}/> Configuración</button>
        </nav>
        <div className="pt-8 border-t border-white/10 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Private Security Protocol v1.0</div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 pb-32 lg:pb-12">
        {/* Header Superior */}
        <header className="bg-white border-b border-slate-100 px-8 lg:px-16 py-8 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <div>
            <h1 className="text-3xl font-black text-[#0A192F] tracking-tight">{site?.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conexión Segura Activa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-slate-50 rounded-full text-[#0A192F] hover:shadow-md transition-all"><Bell size={22}/></button>
          </div>
        </header>

        <div className="px-8 lg:px-16 py-10 max-w-7xl mx-auto">
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 space-y-10">
                {/* Visualizador de Video */}
                <section className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-300 border-[8px] border-white">
                  {isClient ? (
                    <Player url={site?.url_camara || "https://carriers-actual-funky-intro.trycloudflare.com/camara1/index.m3u8"} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                  ) : <div className="w-full h-full bg-slate-900 animate-pulse"></div>}
                  <div className="absolute top-6 left-6 flex items-center gap-3 bg-red-600 px-4 py-2 rounded-full shadow-xl">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <span className="text-[11px] text-white font-black uppercase tracking-tighter">Live Feed</span>
                  </div>
                </section>

                {/* BOTONERA PROFESIONAL */}
                <section>
                  <h2 className="text-xl font-black text-[#0A192F] mb-6 flex items-center gap-3"><Power size={20}/> Mandos de Seguridad</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ARMADO TOTAL */}
                    <button onClick={() => cambiarEstado('armado', 'Armado Total - Máxima Seg.')} className={`p-8 rounded-[2rem] transition-all duration-500 flex flex-col justify-between h-44 shadow-sm border ${site?.estado_sistema === 'armado' ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-2xl scale-[1.02]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                      <ShieldAlert size={32} strokeWidth={1.5} className={site?.estado_sistema === 'armado' ? 'text-[#D4AF37]' : 'text-slate-300'} />
                      <div className="text-left">
                        <span className="block text-xl font-bold leading-tight">Armado Total</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Máxima Seg.</span>
                      </div>
                    </button>

                    {/* MODO NOCHE */}
                    <button onClick={() => cambiarEstado('parcial', 'Modo Noche - Perímetro')} className={`p-8 rounded-[2rem] transition-all duration-500 flex flex-col justify-between h-44 shadow-sm border ${site?.estado_sistema === 'parcial' ? 'bg-[#D4AF37] text-[#0A192F] border-[#D4AF37] shadow-2xl scale-[1.02]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                      <Shield size={32} strokeWidth={1.5} className={site?.estado_sistema === 'parcial' ? 'text-[#0A192F]' : 'text-slate-300'} />
                      <div className="text-left">
                        <span className="block text-xl font-bold leading-tight">Modo Noche</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Perímetro Activo</span>
                      </div>
                    </button>

                    {/* DESARMADO */}
                    <button onClick={() => cambiarEstado('desarmado', 'Sistema Desarmado - Tránsito Libre')} className={`p-8 rounded-[2rem] transition-all duration-500 flex flex-col justify-between h-44 shadow-sm border ${site?.estado_sistema === 'desarmado' ? 'bg-white border-4 border-emerald-500 text-emerald-700' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                      <ShieldCheck size={32} strokeWidth={1.5} className={site?.estado_sistema === 'desarmado' ? 'text-emerald-500' : 'text-slate-300'} />
                      <div className="text-left">
                        <span className="block text-xl font-bold leading-tight">Desarmar Sistema</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tránsito Libre</span>
                      </div>
                    </button>
                  </div>
                </section>
              </div>

              {/* Sidebar Derecha - Actividad */}
              <aside className="space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-32">
                  <h3 className="text-lg font-black text-[#0A192F] mb-8 flex items-center justify-between">Actividad Reciente <Activity size={18} className="text-[#D4AF37]"/></h3>
                  <div className="space-y-8">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex gap-4 relative">
                        <div className="absolute left-[7px] top-7 bottom-[-32px] w-[2px] bg-slate-50 last:hidden"></div>
                        <div className={`w-4 h-4 rounded-full border-2 bg-white z-10 mt-1 ${log.accion.includes('ARMADO') ? 'border-[#0A192F]' : log.accion.includes('NOCHE') ? 'border-[#D4AF37]' : 'border-emerald-500'}`}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{log.accion}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                            {new Date(log.created_at).toLocaleTimeString('es-CL')} • {new Date(log.created_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('activity')} className="w-full mt-12 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#0A192F] hover:text-white transition-all">Ver Historial Completo</button>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl font-black text-[#0A192F] mb-8">Panel de Configuración</h2>
              <form onSubmit={guardarConfiguracion} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Nombre del Sitio</label>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 focus:ring-4 focus:ring-[#0A192F]/5 outline-none font-medium transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">URL del Túnel (MediaMTX HLS)</label>
                  <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-slate-700 focus:ring-4 focus:ring-[#0A192F]/5 outline-none font-medium transition-all" />
                  <p className="text-[10px] text-slate-400 italic px-2">Recuerda terminar con /index.m3u8</p>
                </div>
                <button type="submit" disabled={guardando} className="w-fit px-12 py-5 bg-[#D4AF37] text-[#0A192F] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-50">
                  <Save size={18}/> {guardando ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </form>
            </div>
          )}

          {/* Vistas simplificadas para Actividad y Cámaras */}
          {activeTab === 'activity' && <div className="bg-white p-12 rounded-[3rem] shadow-sm"><h2 className="text-2xl font-black mb-8 text-[#0A192F]">Historial Maestro</h2><div className="space-y-4">{logs.map(log => (<div key={log.id} className="flex justify-between py-4 border-b border-slate-50"><span className="font-bold text-slate-700">{log.accion}</span><span className="text-xs text-slate-400 font-bold">{new Date(log.created_at).toLocaleString('es-CL')}</span></div>))}</div></div>}
          {activeTab === 'cameras' && <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="aspect-video bg-[#0A192F] rounded-[2rem] overflow-hidden relative shadow-xl"><Player url={site?.url_camara} playing={true} muted={true} playsinline={true} width="100%" height="100%" style={{ objectFit: 'cover' }} /><div className="absolute bottom-5 left-5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white font-black uppercase tracking-widest border border-white/10">CH01 - Acceso Principal</div></div></div>}
        </div>
      </main>

      {/* NAVBAR MÓVIL (Sticky bottom) */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-8 py-6 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] pb-10">
        <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-[#0A192F] text-white' : 'text-slate-300'}`}><Home size={28} /></button>
        <button onClick={() => setActiveTab('cameras')} className={`p-3 rounded-2xl transition-all ${activeTab === 'cameras' ? 'bg-[#0A192F] text-white' : 'text-slate-300'}`}><Video size={28} /></button>
        <button onClick={() => setActiveTab('activity')} className={`p-3 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-[#0A192F] text-white' : 'text-slate-300'}`}><List size={28} /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[#0A192F] text-white' : 'text-slate-300'}`}><Settings size={28} /></button>
      </nav>
    </div>
  );
}