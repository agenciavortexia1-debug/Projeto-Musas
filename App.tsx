import React, { useState, useEffect } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

// SENHA MESTRE PARA ROSE
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

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Impede o Chrome de mostrar o prompt automático
      e.preventDefault();
      // Salva o evento para ser disparado depois
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('PWA instalado com sucesso');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    } else {
      console.log('Usuário recusou a instalação');
    }
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setShowInstallBanner(false);
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

  const mapEntryFromDB = (e: any): WeightEntry => ({
    id: e.id,
    clientId: e.client_id,
    date: e.date,
    weight: parseFloat(e.weight) || 0,
    mood: e.mood,
    notes: e.notes,
    photo: e.photo
  });

  const mapReferralFromDB = (r: any): Referral => ({
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
        if (eRes.data) setEntries(eRes.data.map(mapEntryFromDB));
        if (pRes.data) setProducts(pRes.data);
        if (rRes.data) setReferrals(rRes.data.map(mapReferralFromDB));
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
        if (entriesRes.data) setEntries(entriesRes.data.map(mapEntryFromDB));
        if (allCRes.data) setClients(allCRes.data.map(mapClientFromDB));
        if (allERes.data) setEntries(prev => [...prev, ...allERes.data.map(mapEntryFromDB)]);
        if (pRes.data) setProducts(pRes.data);
        if (refRes.data) setReferrals(refRes.data.map(mapReferralFromDB));
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

  const handleAddEntry = async (data: Omit<WeightEntry, 'id' | 'clientId'>) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('weight_entries').insert([{ client_id: currentUser.id, ...data }]);
      if (error) throw error;
      fetchData(currentUser.id);
    } catch (err: any) {
      alert("Erro ao salvar check-in: " + err.message);
    }
  };

  const handleUpdateProfileImage = async (id: string, imgUrl: string) => {
    await supabase.from('clients').update({ profile_image: imgUrl }).eq('id', id);
    if (currentUser?.id === id) fetchData(id);
    else if (isAdmin) fetchData(undefined, true);
  };

  const handleAddReferral = async (friendName: string, friendContact: string, productId: string) => {
    if (!currentUser) return;
    const product = products.find(p => p.id === productId);
    await supabase.from('referrals').insert([{ 
      referrer_id: currentUser.id, 
      friend_name: friendName.toUpperCase(), 
      friend_contact: friendContact, 
      product_id: productId, 
      product_name: product?.name, 
      reward_value: product?.reward, 
      status: 'pending' 
    }]);
    fetchData(currentUser.id);
  };

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
      const { data: client, error } = await supabase
        .from('clients')
        .select('id, active')
        .eq('password', code)
        .maybeSingle();

      if (error) throw error;
      
      if (!client) {
        alert('Código incorreto ou conta inexistente.');
        setLoading(false);
        return;
      }

      if (!client.active) {
        setView('pending-notice');
        setLoading(false);
        return;
      }

      fetchData(client.id);
    } catch (err: any) {
      alert("Erro no login: " + err.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('landing');
    setAccessCode('');
    setClients([]);
    setEntries([]);
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase text-rose-400 tracking-widest">Sincronizando...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard 
        clients={clients} 
        entries={entries} 
        referrals={referrals}
        products={products}
        onLogout={handleLogout} 
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
          if(confirm('Excluir musa permanentemente?')){ 
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
        client={currentUser} 
        entries={entries.filter(e => e.clientId === currentUser.id)} 
        referrals={referrals.filter(r => r.referrerId === currentUser.id)}
        products={products}
        allClients={clients}
        allEntries={entries}
        onAddEntry={handleAddEntry} 
        onAddReferral={handleAddReferral}
        onUpdateProfileImage={handleUpdateProfileImage}
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter text-neutral-800">
      
      {/* Banner de Instalação PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-6 left-4 right-4 z-[100] bg-white border border-rose-100 rounded-3xl shadow-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
             </div>
             <div>
                <h4 className="text-xs font-black uppercase text-neutral-800">Instalar Aplicativo</h4>
                <p className="text-[10px] text-neutral-400 font-medium">Acesso rápido e offline para sua evolução.</p>
             </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={() => setShowInstallBanner(false)} className="flex-1 sm:flex-none px-6 py-3 bg-neutral-100 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Agora Não</button>
             <button onClick={handleInstallClick} className="flex-1 sm:flex-none px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100">Baixar Agora</button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-rose-50 relative">
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-rose-600 flex items-center justify-center rounded-2xl shadow-xl shadow-rose-100">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light mb-2 italic">Projeto <span className="font-bold not-italic text-rose-600 tracking-tighter">Musas</span></h2>
        <p className="text-rose-400 text-[10px] uppercase tracking-[0.4em] mb-10 font-bold">Consultoria @rosimar_emagrecedores</p>

        {view === 'landing' && (
          <div className="w-full space-y-3">
            <button onClick={() => setView('login-client')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-rose-100">Acessar Painel</button>
            <button onClick={() => setView('register')} className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl border border-rose-100 hover:border-rose-300 transition-all uppercase tracking-widest text-[10px]">Novo Cadastro</button>
            
            {/* Botão de Download Manual caso o banner seja fechado */}
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="mt-6 flex items-center justify-center gap-2 w-full text-rose-400 text-[9px] font-black uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Baixar Aplicativo no Celular
              </button>
            )}
          </div>
        )}

        {view === 'pending-notice' && (
          <div className="w-full space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl">✓</div>
            <h3 className="text-xl font-bold">Cadastro Recebido!</h3>
            <p className="text-sm text-neutral-400 italic">Sua conta está em análise. Aguarde a liberação pela Rosimar para acessar.</p>
            <button onClick={() => setView('landing')} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold uppercase text-xs">Entendi</button>
          </div>
        )}

        {view === 'login-client' && (
          <form onSubmit={handleLogin} className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Código de Acesso</label>
              <input 
                type="password" 
                required 
                autoFocus
                value={accessCode} 
                onChange={(e) => setAccessCode(e.target.value)} 
                className="w-full text-center text-2xl font-bold tracking-[0.3em] py-5 bg-rose-50 border-b-2 border-rose-200 outline-none focus:border-rose-500 transition-all rounded-xl" 
                placeholder="••••" 
              />
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl uppercase text-xs shadow-lg shadow-rose-100">Entrar</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[10px] uppercase font-bold hover:text-rose-500">Voltar para o início</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const password = formData.get('password') as string;
            
            try {
              const { data: existing, error: checkError } = await supabase
                .from('clients')
                .select('id')
                .eq('password', password)
                .maybeSingle();

              if (checkError) throw checkError;
              
              if (existing) {
                alert('Este código já está em uso por outra Musa.');
                setIsSubmitting(false);
                return;
              }

              const { error: insertError } = await supabase.from('clients').insert([{
                name: name.toUpperCase().trim(),
                password: password.trim(),
                height: parseFloat((formData.get('height') as string).replace(',','.')),
                initial_weight: parseFloat((formData.get('initialWeight') as string).replace(',','.')),
                target_weight: parseFloat((formData.get('targetWeight') as string).replace(',','.')),
                start_date: new Date().toISOString(),
                active: false,
                admin_notes: "Bem-vinda à sua nova versão, Musa! ✨ Estou muito feliz em acompanhar sua evolução. Lembre-se: cada pequeno passo te deixa mais próxima do seu grande objetivo. Vamos juntas!"
              }]);
              
              if (insertError) throw insertError;
              setView('pending-notice');
            } catch (err: any) {
              if (err.message === 'Failed to fetch') {
                alert("Erro de Conexão: O seu navegador ou rede está bloqueando o banco de dados. Tente desativar o AdBlock ou usar uma aba anônima.");
              } else {
                alert("Erro no cadastro: " + err.message);
              }
              console.error("Cadastro falhou:", err);
            } finally {
              setIsSubmitting(false);
            }
          }} className="w-full space-y-4 text-left animate-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-3">
              <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold text-neutral-800 focus:bg-white focus:border-rose-300" />
              <div className="grid grid-cols-2 gap-3">
                <input name="height" required placeholder="ALTURA (ex: 165)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:bg-white" />
                <input name="initialWeight" required placeholder="PESO ATUAL (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:bg-white" />
              </div>
              <input name="targetWeight" required placeholder="META DE PESO (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:bg-white" />
              <div className="pt-4 border-t border-rose-50 space-y-2 text-center">
                <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Crie seu código de acesso pessoal</label>
                <input name="password" type="password" required maxLength={12} placeholder="••••" className="w-full px-5 py-4 bg-rose-100 border border-rose-200 rounded-xl text-center text-sm font-bold tracking-[0.5em] outline-none focus:bg-rose-50" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'SOLICITAR ACESSO'}
            </button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-rose-300 text-[10px] uppercase font-bold text-center mt-2 hover:text-rose-500">Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default App;