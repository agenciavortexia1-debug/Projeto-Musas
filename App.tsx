
import React, { useState, useEffect } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const MASTER_ADMIN_PASSWORD = 'rose1213*A'; 

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'landing' | 'login-client' | 'register' | 'pending-notice'>('landing');
  const [accessCode, setAccessCode] = useState('');

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setShowInstallBtn(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Fallback para exibir o botão se não estiver em standalone (mesmo que o evento demore)
    if (!isStandalone) {
        // Pequeno delay para verificar se o evento dispara
        setTimeout(() => {
            if (!isStandalone) setShowInstallBtn(true);
        }, 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Para instalar: Clique no ícone de 'Compartilhar' do seu navegador e depois em 'Adicionar à Tela de Início'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const mapClientFromDB = (c: any): Client => ({
    id: c.id,
    name: c.name,
    password: c.password,
    startDate: c.start_date,
    initialWeight: parseFloat(c.initial_weight) || 0,
    targetWeight: parseFloat(c.target_weight) || 0,
    height: parseFloat(c.height) || 0,
    active: c.active,
    adminNotes: c.admin_notes,
    profileImage: c.profile_image
  });

  const fetchData = async (clientId?: string, asAdmin: boolean = false) => {
    setLoading(true);
    try {
      if (asAdmin) {
        const [cRes, eRes, pRes, rRes] = await Promise.all([
          supabase.from('clients').select('*').order('name'),
          supabase.from('weight_entries').select('*').order('date', { ascending: false }),
          supabase.from('products').select('*'),
          supabase.from('referrals').select('*').order('created_at', { ascending: false })
        ]);
        if (cRes.data) setClients(cRes.data.map(mapClientFromDB));
        if (eRes.data) setEntries(eRes.data.map((e: any) => ({
            id: e.id,
            clientId: e.client_id,
            date: e.date,
            weight: parseFloat(e.weight) || 0,
            mood: e.mood,
            notes: e.notes,
            photo: e.photo
        })));
        if (pRes.data) setProducts(pRes.data);
        if (rRes.data) setReferrals(rRes.data.map((r: any) => ({
            id: r.id,
            referrerId: r.referrer_id,
            friendName: r.friend_name,
            friendContact: r.friend_contact,
            productId: r.product_id,
            productName: r.product_name,
            rewardValue: parseFloat(r.reward_value) || 0,
            status: r.status,
            createdAt: r.created_at,
            paidAt: r.paid_at
        })));
      } else if (clientId) {
        const [meRes, entriesRes, allCRes, allERes, pRes, refRes] = await Promise.all([
          supabase.from('clients').select('*').eq('id', clientId).single(),
          supabase.from('weight_entries').select('*').eq('client_id', clientId).order('date'),
          supabase.from('clients').select('id, name, profile_image, active, initial_weight, start_date'),
          supabase.from('weight_entries').select('client_id, weight, date'),
          supabase.from('products').select('*'),
          supabase.from('referrals').select('*').eq('referrer_id', clientId)
        ]);

        if (meRes.data) setCurrentUser(mapClientFromDB(meRes.data));
        if (entriesRes.data) setEntries(entriesRes.data.map((e: any) => ({
            id: e.id,
            clientId: e.client_id,
            date: e.date,
            weight: parseFloat(e.weight) || 0,
            mood: e.mood,
            notes: e.notes,
            photo: e.photo
        })));
        if (allCRes.data) setClients(allCRes.data.map(mapClientFromDB));
        if (allERes.data) {
            const mapped = allERes.data.map((e: any) => ({
                id: e.id,
                clientId: e.client_id,
                date: e.date,
                weight: parseFloat(e.weight) || 0,
                mood: e.mood,
                notes: e.notes,
                photo: e.photo
            }));
            setEntries(prev => [...prev, ...mapped]);
        }
        if (pRes.data) setProducts(pRes.data);
        if (refRes.data) setReferrals(refRes.data.map((r: any) => ({
            id: r.id,
            referrerId: r.referrer_id,
            friendName: r.friend_name,
            friendContact: r.friend_contact,
            productId: r.product_id,
            productName: r.product_name,
            rewardValue: parseFloat(r.reward_value) || 0,
            status: r.status,
            createdAt: r.created_at,
            paidAt: r.paid_at
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInitialLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim();
    if (code === MASTER_ADMIN_PASSWORD) {
      setIsAdmin(true);
      fetchData(undefined, true);
      return;
    }
    setLoading(true);
    try {
      const { data: client } = await supabase.from('clients').select('id, active').eq('password', code).maybeSingle();
      if (!client) {
        alert('Código incorreto.');
        setLoading(false);
        return;
      }
      if (!client.active) {
        setView('pending-notice');
        setLoading(false);
        return;
      }
      fetchData(client.id);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('landing');
    setAccessCode('');
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase text-rose-400 tracking-widest">Carregando...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard 
        clients={clients} entries={entries} referrals={referrals} products={products} onLogout={handleLogout} 
        onToggleClientActive={async (id) => {
          const c = clients.find(x => x.id === id);
          await supabase.from('clients').update({ active: !c?.active }).eq('id', id);
          fetchData(undefined, true);
        }}
        onUpdateAdminNotes={async (id, notes) => {
          await supabase.from('clients').update({ admin_notes: notes }).eq('id', id);
          fetchData(undefined, true);
        }}
        onUpdateClientPassword={async (id, p) => { 
          await supabase.from('clients').update({ password: p }).eq('id', id);
          fetchData(undefined, true);
        }}
        onDeleteClient={async (id) => { 
          if(confirm('Excluir?')){ 
            await supabase.from('clients').delete().eq('id', id);
            fetchData(undefined, true);
          } 
        }}
        onUpdateReferralStatus={async (id, status) => {
          await supabase.from('referrals').update({ status }).eq('id', id);
          fetchData(undefined, true);
        }}
        onPayCommission={async (id) => {
          await supabase.from('referrals').update({ paid_at: new Date().toISOString() }).eq('id', id);
          fetchData(undefined, true);
        }}
        onAddProduct={async (n, r) => {
          await supabase.from('products').insert([{ name: n, reward: r }]);
          fetchData(undefined, true);
        }}
        onDeleteProduct={async (id) => {
          await supabase.from('products').delete().eq('id', id);
          fetchData(undefined, true);
        }}
      />
    );
  }

  if (currentUser) {
    return (
      <ClientDashboard 
        client={currentUser} entries={entries.filter(e => e.clientId === currentUser.id)} referrals={referrals.filter(r => r.referrerId === currentUser.id)}
        products={products} allClients={clients} allEntries={entries}
        onAddEntry={async (data) => {
          await supabase.from('weight_entries').insert([{ client_id: currentUser.id, ...data }]);
          fetchData(currentUser.id);
        }} 
        onAddReferral={async (n, c, pId) => {
          const p = products.find(x => x.id === pId);
          await supabase.from('referrals').insert([{ referrer_id: currentUser.id, friend_name: n.toUpperCase(), friend_contact: c, product_id: pId, product_name: p?.name, reward_value: p?.reward, status: 'pending' }]);
          fetchData(currentUser.id);
        }}
        onUpdateProfileImage={async (id, url) => {
          await supabase.from('clients').update({ profile_image: url }).eq('id', id);
          fetchData(id);
        }}
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter text-neutral-800">
      
      {/* BOTÃO DE DOWNLOAD - EXATAMENTE COMO NA IMAGEM */}
      {showInstallBtn && (
        <div className="fixed top-6 right-6 z-[100] animate-bounce">
          <button 
            onClick={handleInstallClick}
            className="bg-musa-gradient text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixe o app
          </button>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 text-center border border-rose-50 relative overflow-hidden">
        <div className="flex justify-center mb-10">
          <div className="w-24 h-24 bg-musa-gradient flex items-center justify-center rounded-[2.5rem] shadow-2xl shadow-rose-200 relative overflow-hidden group">
            <svg className="w-16 h-16 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S10.9,2,12,2z" />
              <path d="M16.5,10.5c0-1.5-1.5-3-3.5-3.5c-0.5,0-1,0-1.5,0s-1,0-1.5,0c-2,0.5-3.5,2-3.5,3.5c0,2.5,1,3.5,2,4.5c0.5,0.5,1,1.5,1,2.5v2h1v-2c0-1-0.5-2-1-2.5c-0.3-0.3-0.7-0.7-1-1c1-1,3-1,4,0c-0.3,0.3-0.7,0.7-1,1c-0.5,0.5-1,1.5-1,2.5v2h1v-2c0-1,0.5-2,1-2.5C15.5,14,16.5,13,16.5,10.5z" />
              <path d="M10,14.5l1.5,1.5l3-3" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light mb-2 italic tracking-tight">Projeto <span className="font-extrabold not-italic text-rose-600 tracking-tighter">Musas</span></h2>
        <p className="text-rose-400/60 text-[9px] uppercase tracking-[0.5em] mb-12 font-black">Consultoria Rosimar</p>

        {view === 'landing' && (
          <div className="w-full space-y-4">
            <button onClick={() => setView('login-client')} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-700 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-rose-100">Entrar no Painel</button>
            <button onClick={() => setView('register')} className="w-full bg-white text-rose-600 font-bold py-4 rounded-2xl border border-rose-100 hover:border-rose-300 transition-all uppercase tracking-widest text-[10px]">Cadastrar-se</button>
            <div className="pt-8 border-t border-rose-50 mt-4 text-[8px] text-neutral-400 uppercase font-bold tracking-widest leading-relaxed">Transformando vidas, uma musa por vez. ✨</div>
          </div>
        )}

        {view === 'login-client' && (
          <form onSubmit={handleLogin} className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black text-rose-300 uppercase tracking-widest ml-1">Seu Código Musa</label>
              <input type="password" required autoFocus value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full text-center text-3xl font-black tracking-[0.4em] py-6 bg-rose-50/50 border-b-4 border-rose-100 outline-none focus:border-rose-500 transition-all rounded-2xl text-rose-600" placeholder="••••" />
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl uppercase text-xs shadow-xl shadow-rose-100 tracking-widest">Acessar Jornada</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[10px] uppercase font-bold hover:text-rose-500">Voltar</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            const fd = new FormData(e.currentTarget);
            try {
              const { data: exist } = await supabase.from('clients').select('id').eq('password', fd.get('password')).maybeSingle();
              if (exist) { alert('Código já usado.'); setIsSubmitting(false); return; }
              await supabase.from('clients').insert([{
                name: (fd.get('name') as string).toUpperCase().trim(),
                password: (fd.get('password') as string).trim(),
                height: parseFloat((fd.get('height') as string).replace(',','.')),
                initial_weight: parseFloat((fd.get('initialWeight') as string).replace(',','.')),
                target_weight: parseFloat((fd.get('targetWeight') as string).replace(',','.')),
                start_date: new Date().toISOString(),
                active: false,
                admin_notes: "Bem-vinda, Musa! ✨ Vamos juntas!"
              }]);
              setView('pending-notice');
            } catch (err) { alert("Erro ao cadastrar."); } finally { setIsSubmitting(false); }
          }} className="w-full space-y-4 text-left animate-in slide-in-from-bottom-4 duration-300">
            <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none text-xs font-bold" />
            <div className="grid grid-cols-2 gap-3">
                <input name="height" required placeholder="ALTURA (ex: 165)" className="px-5 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none text-xs font-bold" />
                <input name="initialWeight" required placeholder="PESO ATUAL" className="px-5 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none text-xs font-bold" />
            </div>
            <input name="targetWeight" required placeholder="META DE PESO" className="w-full px-5 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none text-xs font-bold" />
            <input name="password" type="password" required maxLength={12} placeholder="CRIE SEU CÓDIGO" className="w-full px-5 py-5 bg-rose-100 rounded-2xl text-center text-xl font-black tracking-[0.5em] text-rose-600 outline-none" />
            <button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs">{isSubmitting ? 'ENVIANDO...' : 'SOLICITAR ACESSO'}</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-rose-300 text-[10px] uppercase font-bold text-center mt-2">Voltar</button>
          </form>
        )}

        {view === 'pending-notice' && (
          <div className="w-full space-y-8 animate-in zoom-in-95 duration-300 py-10">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
            <h3 className="text-xl font-bold">Solicitação Enviada!</h3>
            <p className="text-sm text-neutral-400 font-light">A Rosimar irá validar seu acesso em breve. Fique atenta!</p>
            <button onClick={() => setView('landing')} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold uppercase text-xs">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
