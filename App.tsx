
import React, { useState, useEffect } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const ADMIN_PASSWORD = 'admin'; 

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'landing' | 'login-client' | 'register' | 'admin-login' | 'pending-notice'>('landing');
  
  const [accessCode, setAccessCode] = useState('');
  const [adminPass, setAdminPass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: clientsData } = await supabase.from('clients').select('*');
      const { data: entriesData } = await supabase.from('weight_entries').select('*');
      const { data: productsData } = await supabase.from('products').select('*');
      const { data: referralsData } = await supabase.from('referrals').select('*');

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;
    const heightRaw = formData.get('height') as string;
    const initialWeightRaw = formData.get('initialWeight') as string;
    const targetWeightRaw = formData.get('targetWeight') as string;

    if (!name || !password || !heightRaw || !initialWeightRaw || !targetWeightRaw) {
      alert("Por favor, preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: existing } = await supabase.from('clients').select('id').eq('password', password.trim()).maybeSingle();
      if (existing) {
        alert('Este código já está sendo usado por outra pessoa. Escolha outro código de 4 dígitos.');
        setIsSubmitting(false);
        return;
      }

      const parseNum = (val: string) => {
        const cleaned = val.replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const newClientData = {
        name: name.toUpperCase().trim(),
        password: password.trim(),
        height: parseNum(heightRaw),
        initial_weight: parseNum(initialWeightRaw),
        target_weight: parseNum(targetWeightRaw),
        active: false,
        admin_notes: "Olá! Seja bem-vinda ao Projeto Musas. Aguarde minha liberação para começar."
      };

      const { error } = await supabase.from('clients').insert([newClientData]);
      if (error) throw error;

      await fetchData();
      setView('pending-notice');
    } catch (err: any) {
      alert('Erro ao realizar cadastro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.password === accessCode.trim());
    if (!client) { alert('Código incorreto.'); return; }
    if (!client.active) { setView('pending-notice'); return; }
    setCurrentUser(client);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setCurrentUser(null);
    } else { alert('Senha inválida.'); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('landing');
    setAccessCode('');
    setAdminPass('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser) {
    const updatedClient = clients.find(c => c.id === currentUser?.id) || currentUser;
    return (
      <ClientDashboard 
        client={updatedClient} 
        entries={entries.filter(e => e.clientId === updatedClient.id)} 
        referrals={referrals.filter(r => r.referrerId === updatedClient.id)}
        products={products}
        allClients={clients}
        allEntries={entries}
        onAddEntry={async (data) => { await supabase.from('weight_entries').insert([{ client_id: updatedClient.id, ...data }]); fetchData(); }} 
        onAddReferral={async (fn, fc, pi) => { 
          const p = products.find(prod => prod.id === pi);
          await supabase.from('referrals').insert([{ referrer_id: updatedClient.id, friend_name: fn, friend_contact: fc, product_id: pi, product_name: p?.name, reward_value: p?.reward, status: 'pending' }]); 
          fetchData(); 
        }}
        onUpdateProfileImage={async (id, img) => { await supabase.from('clients').update({ profile_image: img }).eq('id', id); fetchData(); }}
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
        onToggleClientActive={async (id) => { const c = clients.find(x => x.id === id); await supabase.from('clients').update({ active: !c?.active }).eq('id', id); fetchData(); }}
        onUpdateAdminNotes={async (id, n) => { await supabase.from('clients').update({ admin_notes: n }).eq('id', id); fetchData(); }}
        onUpdateClientPassword={async (id, p) => { await supabase.from('clients').update({ password: p }).eq('id', id); fetchData(); }}
        onDeleteClient={async (id) => { if(confirm('Excluir?')){ await supabase.from('clients').delete().eq('id', id); fetchData(); } }}
        onUpdateReferralStatus={async (id, s) => { await supabase.from('referrals').update({ status: s }).eq('id', id); fetchData(); }}
        onPayCommission={async (id) => { await supabase.from('referrals').update({ paid_at: new Date().toISOString() }).eq('id', id); fetchData(); }}
        onAddProduct={async (n, r) => { await supabase.from('products').insert([{ name: n, reward: r }]); fetchData(); }}
        onDeleteProduct={async (id) => { await supabase.from('products').delete().eq('id', id); fetchData(); }}
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
            <button onClick={() => setView('admin-login')} className="w-full text-rose-300 text-[8px] font-bold uppercase tracking-widest mt-10">Admin</button>
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
            <input type="password" required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full text-center text-4xl font-bold tracking-[0.5em] py-4 bg-rose-50 border-b-2 border-rose-200 outline-none focus:border-rose-500 transition-all" placeholder="••••" />
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl uppercase text-xs">Entrar</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[10px] uppercase font-bold">Voltar</button>
          </form>
        )}

        {view === 'admin-login' && (
          <form onSubmit={handleAdminLogin} className="w-full space-y-4">
            <input type="password" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full px-4 py-4 bg-rose-50 border rounded-xl outline-none" placeholder="Senha Admin" />
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl uppercase text-xs">Entrar</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[10px] uppercase font-bold">Voltar</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4 text-left">
            <div className="space-y-3">
              <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold text-neutral-800" />
              <div className="grid grid-cols-2 gap-3">
                <input name="height" required placeholder="ALTURA (CM)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
                <input name="initialWeight" required placeholder="PESO (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
              </div>
              <input name="targetWeight" required placeholder="META DE PESO (KG)" className="w-full px-5 py-4 bg-rose-50 border border-rose-100 rounded-xl outline-none text-xs font-bold" />
              <div className="pt-4 border-t border-rose-50 space-y-2">
                <label className="text-[9px] font-bold text-rose-400 uppercase block text-center">Crie seu código de acesso</label>
                <input name="password" type="password" required placeholder="EX: 1234" className="w-full px-5 py-4 bg-rose-100 border border-rose-200 rounded-xl text-center text-sm font-bold tracking-[0.5em] outline-none" />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full ${isSubmitting ? 'bg-rose-300' : 'bg-rose-600 hover:bg-rose-700'} text-white font-bold py-5 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
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
