
import React, { useState, useEffect } from 'react';
import { Client, WeightEntry, AppState, Referral, Product, ReferralStatus } from './types';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';

const STORAGE_KEY = 'fittrack_premium_v7'; 
const ADMIN_PASSWORD = 'admin'; 

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      clients: [],
      entries: [],
      referrals: [],
      products: [
        { id: '1', name: 'Kit Emagrecimento 30 dias', reward: 50 },
        { id: '2', name: 'Chá Diurético Premium', reward: 20 }
      ],
      currentUser: null,
      isAdmin: false
    };
  });

  const [view, setView] = useState<'landing' | 'login-client' | 'register' | 'admin-login' | 'pending-notice'>('landing');
  const [accessCode, setAccessCode] = useState('');
  const [adminPass, setAdminPass] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    if (state.clients.some(c => c.password === password)) {
      alert('Este código já está sendo usado.');
      return;
    }

    const newClient: Client = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      password: password,
      height: parseFloat(formData.get('height') as string),
      initialWeight: parseFloat(formData.get('initialWeight') as string),
      targetWeight: parseFloat(formData.get('targetWeight') as string),
      startDate: new Date().toISOString(),
      active: false,
      adminNotes: "Bem-vinda! Estou ansiosa para acompanhar sua evolução.",
    };

    setState(prev => ({
      ...prev,
      clients: [...prev.clients, newClient],
    }));
    
    setView('pending-notice');
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const client = state.clients.find(c => c.password === accessCode);
    if (!client) { alert('Código incorreto.'); return; }
    if (!client.active) { setView('pending-notice'); return; }

    setState(prev => ({ ...prev, currentUser: client, isAdmin: false }));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setState(prev => ({ ...prev, isAdmin: true, currentUser: null }));
    } else {
      alert('Senha inválida.');
    }
  };

  const handleToggleClientActive = (clientId: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === clientId ? { ...c, active: !c.active } : c)
    }));
  };

  const handleUpdateAdminNotes = (clientId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === clientId ? { ...c, adminNotes: notes } : c)
    }));
  };

  const handleUpdateProfileImage = (clientId: string, base64: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === clientId ? { ...c, profileImage: base64 } : c)
    }));
  };

  const handleDeleteClient = (clientId: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== clientId),
      entries: prev.entries.filter(e => e.clientId !== clientId),
      referrals: prev.referrals.filter(r => r.referrerId !== clientId)
    }));
  };

  const handleAddEntry = (entryData: Omit<WeightEntry, 'id' | 'clientId'>) => {
    if (!state.currentUser) return;
    const newEntry: WeightEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      clientId: state.currentUser.id,
    };
    setState(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry]
    }));
  };

  const handleAddReferral = (friendName: string, friendContact: string, productId: string) => {
    if (!state.currentUser) return;
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const newRef: Referral = {
      id: crypto.randomUUID(),
      referrerId: state.currentUser.id,
      friendName,
      friendContact,
      productId: product.id,
      productName: product.name,
      rewardValue: product.reward,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      referrals: [...prev.referrals, newRef]
    }));
  };

  const handleUpdateReferralStatus = (referralId: string, status: ReferralStatus) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => 
        r.id === referralId ? { ...r, status, paidAt: undefined } : r
      )
    }));
  };

  const handlePayCommission = (referralId: string) => {
    setState(prev => ({
      ...prev,
      referrals: prev.referrals.map(r => 
        r.id === referralId ? { ...r, paidAt: new Date().toISOString() } : r
      )
    }));
  };

  const handleAddProduct = (name: string, reward: number) => {
    const newProd: Product = { id: crypto.randomUUID(), name, reward };
    setState(prev => ({ ...prev, products: [...prev.products, newProd] }));
  };

  const handleDeleteProduct = (id: string) => {
    setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null, isAdmin: false }));
    setView('landing');
    setAccessCode('');
    setAdminPass('');
  };

  if (state.currentUser) {
    const updatedClient = state.clients.find(c => c.id === state.currentUser?.id) || state.currentUser;
    return (
      <ClientDashboard 
        client={updatedClient} 
        entries={state.entries.filter(e => e.clientId === updatedClient.id)} 
        referrals={state.referrals.filter(r => r.referrerId === updatedClient.id)}
        products={state.products}
        allClients={state.clients}
        allEntries={state.entries}
        onAddEntry={handleAddEntry} 
        onAddReferral={handleAddReferral}
        onUpdateProfileImage={handleUpdateProfileImage}
        onLogout={handleLogout} 
      />
    );
  }

  if (state.isAdmin) {
    return (
      <AdminDashboard 
        clients={state.clients} 
        entries={state.entries} 
        referrals={state.referrals}
        products={state.products}
        onLogout={handleLogout} 
        onToggleClientActive={handleToggleClientActive}
        onUpdateAdminNotes={handleUpdateAdminNotes}
        onDeleteClient={handleDeleteClient}
        onUpdateReferralStatus={handleUpdateReferralStatus}
        onPayCommission={handlePayCommission}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-400"></div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-rose-50 flex flex-col items-center p-12 text-center">
        <div className="mb-10 group cursor-default">
          <div className="w-20 h-20 bg-rose-500 flex items-center justify-center rounded-lg shadow-2xl hover:bg-rose-600 transition-colors duration-500">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-4xl font-light text-neutral-800 mb-2 tracking-tighter italic">Projeto <span className="font-bold not-italic text-rose-600">Musas</span></h2>
        <p className="text-rose-400 text-[10px] uppercase tracking-[0.4em] mb-12 font-bold">Consultoria @rosimar_emagrecedores</p>

        {view === 'landing' && (
          <div className="w-full space-y-4">
            <button onClick={() => setView('login-client')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-lg hover:bg-rose-700 transition-all uppercase tracking-[0.2em] text-xs shadow-lg">Acessar Diário</button>
            <button onClick={() => setView('register')} className="w-full bg-white text-rose-600 font-bold py-4 rounded-lg border border-rose-100 hover:border-rose-300 transition-all uppercase tracking-[0.2em] text-[10px]">Novo Cadastro</button>
            <button onClick={() => setView('admin-login')} className="w-full text-rose-200 text-[9px] font-bold uppercase tracking-[0.3em] hover:text-rose-500 transition-colors pt-12">Área Administrativa</button>
          </div>
        )}

        {view === 'pending-notice' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto"><span className="text-rose-500 text-2xl">✓</span></div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-neutral-800 tracking-tight">Cadastro Recebido!</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed italic">Aguarde a liberação do seu perfil por **@rosimar_emagrecedores** para começar.</p>
            </div>
            <button onClick={() => setView('landing')} className="w-full bg-rose-600 text-white font-bold py-5 rounded-lg shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Entendi</button>
          </div>
        )}

        {view === 'login-client' && (
          <form onSubmit={handleClientLogin} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <input type="password" autoFocus required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full text-center text-5xl font-light tracking-[0.5em] py-6 bg-rose-50/20 border-b-2 border-rose-100 focus:border-rose-500 focus:bg-white outline-none transition-all placeholder:text-neutral-100" placeholder="••••" />
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">Código Pessoal</p>
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-lg shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Entrar</button>
          </form>
        )}

        {view === 'admin-login' && (
          <form onSubmit={handleAdminLogin} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Senha Mestre</label>
              <input type="password" autoFocus required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full text-center text-xl font-light px-4 py-4 bg-rose-50/20 border border-rose-100 rounded-lg focus:border-rose-500 outline-none transition-all" />
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-lg shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Entrar Admin</button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <input name="name" required placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              <div className="grid grid-cols-2 gap-3">
                <input name="height" type="number" required placeholder="ALTURA (CM)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
                <input name="initialWeight" type="number" step="0.1" required placeholder="PESO (KG)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              </div>
              <input name="targetWeight" type="number" step="0.1" required placeholder="META DE PESO (KG)" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs tracking-widest font-medium" />
              <div className="pt-4 space-y-3">
                <div className="w-full h-px bg-rose-50"></div>
                <label className="text-[9px] font-bold text-rose-300 uppercase tracking-[0.2em] block">Crie seu código de acesso</label>
                <input name="password" type="password" required placeholder="EX: 1234" className="w-full px-5 py-4 bg-rose-100 border border-rose-200 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-sm font-bold text-rose-800 text-center tracking-[0.5em]" />
              </div>
            </div>
            <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-lg shadow-lg hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">Solicitar Cadastro</button>
          </form>
        )}
      </div>

      <div className="mt-12 text-[9px] font-bold text-rose-200 uppercase tracking-[0.5em] text-center max-w-xs leading-loose">
        PROTOCOLO EXCLUSIVO — CONSULTORIA INDIVIDUALIZADA —
      </div>
    </div>
  );
};

export default App;
