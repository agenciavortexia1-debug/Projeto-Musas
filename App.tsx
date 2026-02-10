
import React, { useState, useEffect, useCallback } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const MASTER_ADMIN_PASSWORD = 'rose1213*A'; 

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'landing' | 'login-client' | 'register' | 'pending-notice'>('landing');
  
  const [accessCode, setAccessCode] = useState('');

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
    waist: e.waist ? parseFloat(e.waist) : undefined,
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

  const fetchData = async () => {
    try {
      const [
        { data: clientsData },
        { data: entriesData },
        { data: productsData },
        { data: referralsData }
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('weight_entries').select('*'),
        supabase.from('products').select('*'),
        supabase.from('referrals').select('*')
      ]);

      if (clientsData) setClients(clientsData.map(mapClientFromDB));
      if (entriesData) setEntries(entriesData.map(mapEntryFromDB));
      if (productsData) setProducts(productsData);
      if (referralsData) setReferrals(referralsData.map(mapReferralFromDB));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEntry = async (data: Omit<WeightEntry, 'id' | 'clientId'>) => {
    if (!currentUser) return;
    const tempId = crypto.randomUUID();
    const newEntry: WeightEntry = { ...data, id: tempId, clientId: currentUser.id };
    
    setEntries(prev => [...prev, newEntry]);

    try {
      await supabase.from('weight_entries').insert([{ client_id: currentUser.id, ...data }]);
    } catch (err) {
      setEntries(prev => prev.filter(e => e.id !== tempId));
      alert("Erro ao salvar no servidor. Tente novamente.");
    }
  };

  const handleUpdateProfileImage = async (id: string, img: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, profileImage: img } : c));
    await supabase.from('clients').update({ profile_image: img }).eq('id', id);
  };

  const handleAddReferral = async (friendName: string, friendContact: string, productId: string) => {
    if (!currentUser) return;
    const product = products.find(p => p.id === productId);
    const tempId = crypto.randomUUID();
    const newRef: Referral = {
      id: tempId,
      referrerId: currentUser.id,
      friendName,
      friendContact,
      productId,
      productName: product?.name || '',
      rewardValue: product?.reward || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setReferrals(prev => [...prev, newRef]);
    await supabase.from('referrals').insert([{ 
      referrer_id: currentUser.id, 
      friend_name: friendName, 
      friend_contact: friendContact, 
      product_id: productId, 
      product_name: product?.name, 
      reward_value: product?.reward, 
      status: 'pending' 
    }]);
  };

  const handleToggleClientActive = async (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    const target = clients.find(c => c.id === id);
    await supabase.from('clients').update({ active: !target?.active }).eq('id', id);
  };

  const handleUpdateAdminNotes = async (id: string, notes: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, adminNotes: notes } : c));
    await supabase.from('clients').update({ admin_notes: notes }).eq('id', id);
  };

  const handleUpdateReferralStatus = async (id: string, status: ReferralStatus) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await supabase.from('referrals').update({ status }).eq('id', id);
  };

  const handlePayCommission = async (id: string) => {
    const now = new Date().toISOString();
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, paidAt: now } : r));
    await supabase.from('referrals').update({ paid_at: now }).eq('id', id);
  };

  const handleAddProduct = async (name: string, reward: number) => {
    const tempId = crypto.randomUUID();
    setProducts(prev => [...prev, { id: tempId, name, reward }]);
    await supabase.from('products').insert([{ name, reward }]);
    fetchData(); 
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim();

    // Admin Master Access Check
    if (code === MASTER_ADMIN_PASSWORD) {
      setIsAdmin(true);
      setCurrentUser(null);
      return;
    }

    const client = clients.find(c => c.password === code);
    if (!client) { alert('Código incorreto.'); return; }
    if (!client.active) { setView('pending-notice'); return; }
    setCurrentUser(client);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('landing');
    setAccessCode('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <ClientDashboard 
        client={clients.find(c => c.id === currentUser.id) || currentUser} 
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

  if (isAdmin) {
    return (
      <AdminDashboard 
        clients={clients} 
        entries={entries} 
        referrals={referrals}
        products={products}
        onLogout={handleLogout} 
        onToggleClientActive={handleToggleClientActive}
        onUpdateAdminNotes={handleUpdateAdminNotes}
        onUpdateClientPassword={async (id, p) => { 
          setClients(prev => prev.map(c => c.id === id ? { ...c, password: p } : c));
          await supabase.from('clients').update({ password: p }).eq('id', id); 
        }}
        onDeleteClient={async (id) => { 
          if(confirm('Excluir?')){ 
            setClients(prev => prev.filter(c => c.id !== id));
            await supabase.from('clients').delete().eq('id', id); 
          } 
        }}
        onUpdateReferralStatus={handleUpdateReferralStatus}
        onPayCommission={handlePayCommission}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-rose-50">
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-rose-600 flex items-center justify-center rounded-2xl shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" /></svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light text-neutral-800 mb-2 italic">Projeto <span className="font-bold not-italic text-rose-600">Musas</span></h2>
        <p className="text-rose-400 text-[10px] uppercase tracking-[0.4em] mb-10 font-bold">Consultoria @rosimar_emagrecedores</p>

        {view === 'landing' && (
          <div className="w-full space-y-3">
            <button onClick={() => setView('login-client')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Acessar Diário</button>
            <button onClick={() => setView('register')} className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl border border-rose-100 hover:border-rose-300 transition-all uppercase tracking-widest text-[10px]">Novo Cadastro</button>
          </div>
        )}

        {view === 'pending-notice' && (
          <div className="w-full space-y-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl">✓</div>
            <h3 className="text-xl font-bold">Cadastro Recebido!</h3>
            <p className="text-sm text-neutral-400 italic">Aguarde a liberação pela Rosimar para acessar seu painel.</p>
            <button onClick={() => setView('landing')} className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold uppercase text-xs">Voltar</button>
          </div>
        )}

        {view === 'login-client' && (
          <form onSubmit={handleClientLogin} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Código de Acesso</label>
              <input type="password" required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full text-center text-3xl font-bold tracking-[0.3em] py-4 bg-rose-50 border-b-2 border-rose-200 outline-none focus:border-rose-500 transition-all" placeholder="••••" />
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl uppercase text-xs shadow-lg shadow-rose-100">Entrar</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[10px] uppercase font-bold">Voltar</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const password = formData.get('password') as string;
            
            const { data: existing } = await supabase.from('clients').select('id').eq('password', password.trim()).maybeSingle();
            if (existing) {
              alert('Este código já está em uso.');
              setIsSubmitting(false);
              return;
            }

            await supabase.from('clients').insert([{
              name: name.toUpperCase().trim(),
              password: password.trim(),
              height: parseFloat((formData.get('height') as string).replace(',','.')),
              initial_weight: parseFloat((formData.get('initialWeight') as string).replace(',','.')),
              target_weight: parseFloat((formData.get('targetWeight') as string).replace(',','.')),
              active: false,
              admin_notes: "Aguardando liberação..."
            }]);
            
            fetchData();
            setIsSubmitting(false);
            setView('pending-notice');
          }} className="w-full space-y-4 text-left">
            <div className="space-y-3">
              <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold text-neutral-800" />
              <div className="grid grid-cols-2 gap-3">
                <input name="height" required placeholder="ALTURA (CM)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
                <input name="initialWeight" required placeholder="PESO (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
              </div>
              <input name="targetWeight" required placeholder="META DE PESO (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
              <div className="pt-4 border-t border-rose-50 space-y-2 text-center">
                <label className="text-[9px] font-bold text-rose-400 uppercase">Defina seu código de acesso</label>
                <input name="password" type="password" required maxLength={12} placeholder="••••" className="w-full px-5 py-4 bg-rose-100 border border-rose-200 rounded-xl text-center text-sm font-bold tracking-[0.5em] outline-none" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center">
              {isSubmitting ? 'SOLICITANDO...' : 'SOLICITAR CADASTRO'}
            </button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-rose-300 text-[10px] uppercase font-bold text-center mt-2">Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default App;
