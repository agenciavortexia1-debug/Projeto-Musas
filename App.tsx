
/*
-- SQL PARA GERAR AS TABELAS NO SUPABASE (COPIE E COLE NO SQL EDITOR):

-- 1. Tabela de Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  initial_weight NUMERIC NOT NULL,
  target_weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  profile_image TEXT
);

-- 2. Tabela de Pesagens
CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight NUMERIC NOT NULL,
  waist NUMERIC,
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'sad')),
  notes TEXT,
  photo TEXT -- Base64 ou URL
);

-- 3. Tabela de Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reward NUMERIC NOT NULL
);

-- 4. Tabela de Indicações
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL,
  friend_contact TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  reward_value NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'bought', 'not_bought')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS (Opcional para anon access, mas bom para o Supabase dashboard)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso simplificadas (Anon)
CREATE POLICY "Allow anon read all" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON clients FOR UPDATE USING (true);

CREATE POLICY "Allow anon all weight" ON weight_entries FOR ALL USING (true);
CREATE POLICY "Allow anon all products" ON products FOR ALL USING (true);
CREATE POLICY "Allow anon all referrals" ON referrals FOR ALL USING (true);
*/

import React, { useState, useEffect } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const ADMIN_PASSWORD = 'admin'; 

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'landing' | 'login-client' | 'register' | 'admin-login' | 'pending-notice'>('landing');
  
  const [accessCode, setAccessCode] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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

  const mapClientFromDB = (c: any): Client => ({
    id: c.id,
    name: c.name,
    password: c.password,
    startDate: c.start_date,
    initialWeight: parseFloat(c.initial_weight),
    targetWeight: parseFloat(c.target_weight),
    height: parseFloat(c.height),
    active: c.active,
    adminNotes: c.admin_notes,
    profileImage: c.profile_image
  });

  const mapEntryFromDB = (e: any): WeightEntry => ({
    id: e.id,
    clientId: e.client_id,
    date: e.date,
    weight: parseFloat(e.weight),
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
    rewardValue: parseFloat(r.reward_value),
    status: r.status,
    createdAt: r.created_at,
    paidAt: r.paid_at
  });

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    const { data: existing } = await supabase.from('clients').select('id').eq('password', password).maybeSingle();
    
    if (existing) {
      alert('Este código já está sendo usado.');
      return;
    }

    const newClientData = {
      name: formData.get('name') as string,
      password: password,
      height: parseFloat(formData.get('height') as string),
      initial_weight: parseFloat(formData.get('initialWeight') as string),
      target_weight: parseFloat(formData.get('targetWeight') as string),
      active: false,
      admin_notes: "Bem-vinda! Estou ansiosa para acompanhar sua evolução."
    };

    const { error } = await supabase.from('clients').insert([newClientData]);
    
    if (error) {
      alert('Erro ao cadastrar. Tente novamente.');
      return;
    }

    await fetchData();
    setView('pending-notice');
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.password === accessCode);
    if (!client) { alert('Código incorreto.'); return; }
    if (!client.active) { setView('pending-notice'); return; }

    setCurrentUser(client);
    setIsAdmin(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setCurrentUser(null);
    } else {
      alert('Senha inválida.');
    }
  };

  const handleToggleClientActive = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    await supabase.from('clients').update({ active: !client.active }).eq('id', clientId);
    await fetchData();
  };

  const handleUpdateAdminNotes = async (clientId: string, notes: string) => {
    await supabase.from('clients').update({ admin_notes: notes }).eq('id', clientId);
    await fetchData();
  };

  const handleUpdateProfileImage = async (clientId: string, base64: string) => {
    await supabase.from('clients').update({ profile_image: base64 }).eq('id', clientId);
    await fetchData();
  };

  const handleUpdateClientPassword = async (clientId: string, newPassword: string) => {
    const { data: existing } = await supabase.from('clients').select('id').eq('password', newPassword).neq('id', clientId).maybeSingle();
    
    if (existing) {
      alert('Este código já está em uso por outra cliente!');
      return;
    }
    await supabase.from('clients').update({ password: newPassword }).eq('id', clientId);
    await fetchData();
    alert('Senha atualizada com sucesso!');
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Excluir esta aluna e todo seu histórico?')) return;
    await supabase.from('clients').delete().eq('id', clientId);
    await fetchData();
  };

  const handleAddEntry = async (entryData: Omit<WeightEntry, 'id' | 'clientId'>) => {
    if (!currentUser) return;
    const dbEntry = {
      client_id: currentUser.id,
      date: entryData.date,
      weight: entryData.weight,
      waist: entryData.waist,
      mood: entryData.mood,
      notes: entryData.notes,
      photo: entryData.photo
    };
    await supabase.from('weight_entries').insert([dbEntry]);
    await fetchData();
  };

  const handleAddReferral = async (friendName: string, friendContact: string, productId: string) => {
    if (!currentUser) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newRef = {
      referrer_id: currentUser.id,
      friend_name: friendName,
      friend_contact: friendContact,
      product_id: product.id,
      product_name: product.name,
      reward_value: product.reward,
      status: 'pending'
    };
    await supabase.from('referrals').insert([newRef]);
    await fetchData();
  };

  const handleUpdateReferralStatus = async (referralId: string, status: ReferralStatus) => {
    await supabase.from('referrals').update({ status, paid_at: null }).eq('id', referralId);
    await fetchData();
  };

  const handlePayCommission = async (referralId: string) => {
    await supabase.from('referrals').update({ paid_at: new Date().toISOString() }).eq('id', referralId);
    await fetchData();
  };

  const handleAddProduct = async (name: string, reward: number) => {
    await supabase.from('products').insert([{ name, reward }]);
    await fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await fetchData();
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
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center font-inter">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-rose-400 text-xs font-bold uppercase tracking-widest">Carregando Musas...</p>
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
        onUpdateClientPassword={handleUpdateClientPassword}
        onDeleteClient={handleDeleteClient}
        onUpdateReferralStatus={handleUpdateReferralStatus}
        onPayCommission={handlePayCommission}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-inter">
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-400"></div>
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-50 flex flex-col items-center p-8 sm:p-12 text-center">
        <div className="mb-8 group cursor-default">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-600 flex items-center justify-center rounded-2xl shadow-xl hover:rotate-3 transition-transform duration-300">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-light text-neutral-800 mb-2 tracking-tighter italic">Projeto <span className="font-bold not-italic text-rose-600">Musas</span></h2>
        <p className="text-rose-400 text-[9px] sm:text-[10px] uppercase tracking-[0.4em] mb-10 font-bold">Consultoria @rosimar_emagrecedores</p>

        {view === 'landing' && (
          <div className="w-full space-y-3">
            <button onClick={() => setView('login-client')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs shadow-lg">Acessar Diário</button>
            <button onClick={() => setView('register')} className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl border border-rose-100 hover:border-rose-300 transition-all uppercase tracking-widest text-[10px]">Novo Cadastro</button>
            <button onClick={() => setView('admin-login')} className="w-full text-rose-300 text-[8px] font-bold uppercase tracking-widest hover:text-rose-600 transition-colors pt-10">Área Administrativa</button>
          </div>
        )}

        {view === 'pending-notice' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto"><span className="text-rose-500 text-2xl">✓</span></div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-neutral-800 tracking-tight">Cadastro Recebido!</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed italic px-4">Aguarde a liberação do seu perfil por **@rosimar_emagrecedores** para começar.</p>
            </div>
            <button onClick={() => setView('landing')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Voltar ao Início</button>
          </div>
        )}

        {view === 'login-client' && (
          <form onSubmit={handleClientLogin} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <input type="password" autoFocus required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full text-center text-4xl sm:text-5xl font-light tracking-[0.5em] py-6 bg-rose-50/20 border-b-2 border-rose-100 focus:border-rose-500 focus:bg-white outline-none transition-all placeholder:text-neutral-100" placeholder="••••" />
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">Código Pessoal</p>
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Entrar</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[9px] uppercase font-bold tracking-widest">Voltar</button>
          </form>
        )}

        {view === 'admin-login' && (
          <form onSubmit={handleAdminLogin} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Senha Mestre</label>
              <input type="password" autoFocus required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full text-center text-xl font-light px-4 py-4 bg-rose-50/20 border border-rose-100 rounded-xl focus:border-rose-500 outline-none transition-all" />
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Entrar Admin</button>
            <button type="button" onClick={() => setView('landing')} className="text-rose-300 text-[9px] uppercase font-bold tracking-widest">Voltar</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
            <div className="space-y-3">
              <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              <div className="grid grid-cols-2 gap-3">
                <input name="height" type="number" required placeholder="ALTURA (CM)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
                <input name="initialWeight" type="number" step="0.1" required placeholder="PESO (KG)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              </div>
              <input name="targetWeight" type="number" step="0.1" required placeholder="META DE PESO (KG)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              <div className="pt-4 space-y-3">
                <div className="w-full h-px bg-rose-50"></div>
                <label className="text-[9px] font-bold text-rose-300 uppercase tracking-[0.2em] block text-center">Crie seu código de acesso</label>
                <input name="password" type="password" required placeholder="EX: 1234" className="w-full px-5 py-4 bg-rose-100 border border-rose-200 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 text-sm font-bold text-rose-800 text-center tracking-[0.5em]" />
              </div>
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Solicitar Cadastro</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-rose-300 text-[9px] uppercase font-bold tracking-widest text-center mt-2">Voltar</button>
          </form>
        )}
      </div>

      <div className="mt-8 text-[9px] font-bold text-rose-200 uppercase tracking-[0.5em] text-center max-w-xs leading-loose">
        PROTOCOLO EXCLUSIVO — CONSULTORIA @ROSIMAR_EMAGRECEDORES
      </div>
    </div>
  );
};

export default App;
