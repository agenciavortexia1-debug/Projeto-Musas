
import React, { useState } from 'react';
import { Client, WeightEntry, Referral, Product, ReferralStatus } from '../types';
import WeightChart from './WeightChart';
import RankingView from './RankingView';

interface AdminDashboardProps {
  clients: Client[];
  entries: WeightEntry[];
  referrals: Referral[];
  products: Product[];
  onLogout: () => void;
  onToggleClientActive: (clientId: string) => void;
  onUpdateAdminNotes: (clientId: string, notes: string) => void;
  onDeleteClient: (clientId: string) => void;
  onUpdateReferralStatus: (referralId: string, status: ReferralStatus) => void;
  onPayCommission: (referralId: string) => void;
  onAddProduct: (name: string, reward: number) => void;
  onDeleteProduct: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  clients, entries, referrals, products, onLogout, onToggleClientActive, onUpdateAdminNotes, onDeleteClient, onUpdateReferralStatus, onPayCommission, onAddProduct, onDeleteProduct
}) => {
  const [activeMenu, setActiveMenu] = useState<'acompanhamento' | 'habilitacao' | 'indicacoes' | 'ranking' | 'produtos'>('acompanhamento');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [newClientsFilter, setNewClientsFilter] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [newProdName, setNewProdName] = useState('');
  const [newProdReward, setNewProdReward] = useState('');

  const getClientEntries = (clientId: string) => entries.filter(e => e.clientId === clientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const getClientStats = (client: Client) => {
    const clientEntries = entries.filter(e => e.clientId === client.id);
    const currentWeight = clientEntries.length > 0 ? clientEntries[clientEntries.length - 1].weight : client.initialWeight;
    const totalLost = client.initialWeight - currentWeight;
    const progressPercent = Math.min(100, Math.max(0, (totalLost / (Math.max(0.1, client.initialWeight - client.targetWeight))) * 100));
    const startDate = new Date(client.startDate).getTime();
    const now = new Date().getTime();
    const weeksDiff = Math.max(1, (now - startDate) / (1000 * 60 * 60 * 24 * 7));
    const weeklyLoss = totalLost / weeksDiff;
    return { currentWeight, totalLost, progressPercent, weeklyLoss };
  };

  const pendingClients = clients.filter(c => !c.active);
  const activeClients = clients.filter(c => c.active);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const totalWeightLost = activeClients.reduce((acc, c) => acc + getClientStats(c).totalLost, 0);
  const averageWeeklyLoss = activeClients.length > 0 
    ? activeClients.reduce((acc, c) => acc + getClientStats(c).weeklyLoss, 0) / activeClients.length 
    : 0;

  const totalCommissionsPaid = referrals
    .filter(r => r.status === 'bought' && r.paidAt)
    .reduce((acc, r) => acc + r.rewardValue, 0);

  const totalCommissionsPending = referrals
    .filter(r => r.status === 'bought' && !r.paidAt)
    .reduce((acc, r) => acc + r.rewardValue, 0);

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setTempNotes(client.adminNotes || '');
  };

  const handleSaveNotes = () => {
    if (selectedClientId) {
      onUpdateAdminNotes(selectedClientId, tempNotes);
      alert('Notas de consultoria publicadas!');
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdReward) return;
    onAddProduct(newProdName, parseFloat(newProdReward));
    setNewProdName('');
    setNewProdReward('');
  };

  return (
    <div className="flex min-h-screen bg-[#FFF9F9] font-sans">
      {/* Modal de visualização de foto ampliada */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Ampliada" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <aside className={`bg-white border-r border-rose-100 flex flex-col transition-all duration-300 ease-in-out fixed h-full z-20 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 border-b border-rose-50 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-sm font-bold text-neutral-800 tracking-tighter italic">Projeto <span className="text-rose-600 not-italic">Musas</span></h1>
              <p className="text-[8px] text-rose-300 uppercase tracking-widest font-black">@rosimar_emagrecedores</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-rose-50 text-rose-500 transition-colors">
            <svg className={`w-5 h-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          <button onClick={() => setActiveMenu('acompanhamento')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeMenu === 'acompanhamento' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {isSidebarOpen && <span>Acompanhamento</span>}
          </button>
          
          <button onClick={() => setActiveMenu('habilitacao')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeMenu === 'habilitacao' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            {isSidebarOpen && <span>Habilitação</span>}
            {pendingClients.length > 0 && <span className={`absolute ${isSidebarOpen ? 'right-3' : 'right-1'} top-3 w-2 h-2 bg-amber-400 rounded-full animate-pulse`}></span>}
          </button>

          <button onClick={() => setActiveMenu('ranking')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeMenu === 'ranking' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            {isSidebarOpen && <span>Ranking</span>}
          </button>

          <button onClick={() => setActiveMenu('indicacoes')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeMenu === 'indicacoes' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {isSidebarOpen && <span>Indicações</span>}
            {referrals.filter(r => r.status === 'pending').length > 0 && <span className={`absolute ${isSidebarOpen ? 'right-3' : 'right-1'} top-3 w-2 h-2 bg-sky-400 rounded-full animate-bounce`}></span>}
          </button>

          <button onClick={() => setActiveMenu('produtos')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeMenu === 'produtos' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {isSidebarOpen && <span>Produtos</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-rose-50">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-bold text-neutral-300 hover:text-rose-600 transition-colors uppercase tracking-widest">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'} p-12 overflow-y-auto`}>
        {activeMenu === 'acompanhamento' && (
          <div className="animate-in fade-in duration-500 space-y-12 pb-20">
            <header><h2 className="text-3xl font-light text-neutral-800 tracking-tight">Visão Geral da <span className="font-semibold text-rose-600">Consultoria</span></h2><p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Monitoramento de resultados em tempo real</p></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-2">Alunas Ativas</p><h3 className="text-3xl font-light text-neutral-800">{activeClients.length}</h3></div>
              <div className="bg-rose-600 p-6 rounded-2xl shadow-xl shadow-rose-100 text-white"><p className="text-rose-100 text-[10px] uppercase font-bold tracking-widest mb-2">KG Eliminados (Total)</p><h3 className="text-3xl font-bold">{totalWeightLost.toFixed(1)} <span className="text-sm font-light opacity-60">kg</span></h3></div>
              <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-2">Pendência Comissão</p><h3 className="text-3xl font-black text-rose-600">R$ {totalCommissionsPending.toFixed(2)}</h3></div>
              <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-2">Total Pago</p><h3 className="text-3xl font-light text-neutral-800">R$ {totalCommissionsPaid.toFixed(2)}</h3></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-1 space-y-4"><h3 className="text-[10px] font-bold text-neutral-800 uppercase tracking-[0.3em] mb-4 border-l-4 border-rose-500 pl-4">Selecione uma Aluna</h3><div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">{activeClients.map(client => { const stats = getClientStats(client); return (<button key={client.id} onClick={() => handleSelectClient(client)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClientId === client.id ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-rose-50 bg-white hover:border-rose-100'}`}><div className="flex justify-between items-baseline mb-2"><span className="font-bold text-neutral-800 text-[11px] uppercase truncate max-w-[140px]">{client.name}</span><span className="text-[10px] font-black text-rose-600">-{stats.totalLost.toFixed(1)}kg</span></div><div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden"><div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${stats.progressPercent}%` }} /></div></button>); })}</div></section>
              <section className="lg:col-span-2">{selectedClient ? (<div className="bg-white p-10 rounded-2xl border border-rose-100 shadow-sm space-y-8 animate-in fade-in duration-300"><div className="flex justify-between items-start border-b border-rose-50 pb-6"><div><h3 className="text-2xl font-light text-neutral-800">{selectedClient.name}</h3><p className="text-rose-300 text-[10px] uppercase tracking-widest mt-1">Check-in: {getClientEntries(selectedClient.id).length} registros</p></div><div className="text-right"><p className="text-[9px] text-rose-300 uppercase font-bold tracking-widest">Perda Semanal Média</p><p className="text-xl font-bold text-rose-600">{getClientStats(selectedClient).weeklyLoss.toFixed(2)}kg</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100"><p className="text-rose-300 text-[8px] uppercase font-bold tracking-widest mb-1">Inicial</p><p className="text-lg font-bold text-neutral-800">{selectedClient.initialWeight.toFixed(1)}kg</p></div><div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100"><p className="text-rose-300 text-[8px] uppercase font-bold tracking-widest mb-1">Atual</p><p className="text-lg font-bold text-neutral-800">{getClientStats(selectedClient).currentWeight.toFixed(1)}kg</p></div><div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100"><p className="text-rose-300 text-[8px] uppercase font-bold tracking-widest mb-1">Eliminados</p><p className="text-lg font-bold text-rose-600">-{getClientStats(selectedClient).totalLost.toFixed(1)}kg</p></div><div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100"><p className="text-rose-300 text-[8px] uppercase font-bold tracking-widest mb-1">Meta</p><p className="text-lg font-bold text-neutral-800">{selectedClient.targetWeight}kg</p></div></div><WeightChart entries={getClientEntries(selectedClient.id)} targetWeight={selectedClient.targetWeight} initialWeight={selectedClient.initialWeight} />

                    {/* Galeria de Validação */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest border-l-4 border-rose-500 pl-4">Galeria de Validação (Histórico)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {getClientEntries(selectedClient.id).map((entry) => (
                          <div 
                            key={entry.id} 
                            onClick={() => setSelectedPhoto(entry.photo)}
                            className="group relative aspect-video bg-rose-50 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all shadow-sm"
                          >
                            <img src={entry.photo} alt="Validação" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                              <p className="text-[8px] text-white font-bold uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[10px] text-rose-200 font-black">{entry.weight.toFixed(1)} kg</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 bg-rose-50/20 p-8 rounded-xl border border-rose-100"><h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Orientação Especial</h4><textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full h-32 bg-white border border-rose-100 rounded-lg p-4 text-sm font-light text-neutral-600 outline-none focus:ring-1 focus:ring-rose-300 transition-all resize-none" /><button onClick={handleSaveNotes} className="w-full bg-rose-600 text-white text-[10px] font-bold py-4 rounded-lg hover:bg-rose-700 transition-all uppercase tracking-widest shadow-lg shadow-rose-100">Atualizar Notas</button></div></div>) : (<div className="h-full flex flex-col items-center justify-center text-rose-200 border-2 border-dashed border-rose-100 rounded-2xl min-h-[400px] opacity-40 italic"><p className="uppercase tracking-[0.4em] text-[10px] font-bold">Selecione uma aluna para ver os detalhes</p></div>)}</section>
            </div>
          </div>
        )}

        {activeMenu === 'habilitacao' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl">
            <header className="mb-10"><h2 className="text-3xl font-light text-neutral-800 tracking-tight">Habilitação de <span className="font-bold text-rose-600">Novos Perfis</span></h2><p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Alunas aguardando liberação de acesso</p></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{pendingClients.map(client => (<div key={client.id} className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between group hover:border-rose-300 transition-all"><div><div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 font-bold uppercase">{client.name.charAt(0)}</div><span className="text-[8px] bg-rose-50 text-rose-400 font-black px-2 py-1 rounded uppercase tracking-widest">Pendente</span></div><p className="font-bold text-neutral-800 text-sm mb-1">{client.name}</p><p className="text-[10px] text-neutral-400 uppercase tracking-widest">Peso: {client.initialWeight}kg | Meta: {client.targetWeight}kg</p></div><div className="mt-8 flex space-x-3"><button onClick={() => onToggleClientActive(client.id)} className="flex-1 bg-rose-600 text-white text-[10px] font-bold py-3 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest shadow-md">Liberar</button><button onClick={() => onDeleteClient(client.id)} className="px-4 bg-neutral-50 text-neutral-300 rounded-xl hover:text-rose-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button></div></div>))}{pendingClients.length === 0 && <div className="col-span-full py-20 text-center bg-rose-50/30 rounded-3xl border-2 border-dashed border-rose-100"><p className="text-rose-300 italic text-sm uppercase tracking-widest font-bold">Nenhum perfil aguardando habilitação.</p></div>}</div>
          </div>
        )}

        {activeMenu === 'ranking' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500"><header className="mb-12"><h2 className="text-3xl font-light text-neutral-800 tracking-tight">Performance das <span className="font-bold text-rose-600">Alunas</span></h2><p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Destaques em perda de peso</p></header><RankingView clients={activeClients} entries={entries} /></div>
        )}

        {activeMenu === 'indicacoes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl space-y-12 pb-20">
            <header><h2 className="text-3xl font-light text-neutral-800 tracking-tight">Gestão de <span className="font-bold text-rose-600">Indicações</span></h2><p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Controle de indicações e gestão de pagamentos de bônus</p></header>
            
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
               <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                  <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1">Comissões Pendentes</p>
                  <p className="text-2xl font-black text-rose-700">R$ {totalCommissionsPending.toFixed(2)}</p>
               </div>
               <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Comissões Pagas</p>
                  <p className="text-2xl font-black text-emerald-700">R$ {totalCommissionsPaid.toFixed(2)}</p>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest">
                   <tr>
                     <th className="px-8 py-5">Referente</th>
                     <th className="px-8 py-5">Amiga / Produto</th>
                     <th className="px-8 py-5">Bônus</th>
                     <th className="px-8 py-5">Venda</th>
                     <th className="px-8 py-5">Pagamento</th>
                     <th className="px-8 py-5 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-rose-50">
                   {referrals.length > 0 ? [...referrals].reverse().map(ref => {
                     const referrer = clients.find(c => c.id === ref.referrerId);
                     return (
                       <tr key={ref.id} className="hover:bg-rose-50/20 transition-colors">
                         <td className="px-8 py-6">
                           <p className="text-xs font-bold text-neutral-800 uppercase">{referrer?.name || '---'}</p>
                           <p className="text-[9px] text-neutral-400">Desde {new Date(ref.createdAt).toLocaleDateString()}</p>
                         </td>
                         <td className="px-8 py-6">
                           <p className="text-sm font-medium text-neutral-600">{ref.friendName}</p>
                           <p className="text-[9px] text-rose-400 font-bold uppercase">{ref.productName}</p>
                         </td>
                         <td className="px-8 py-6 text-[10px] text-neutral-800 font-black">R$ {ref.rewardValue.toFixed(2)}</td>
                         <td className="px-8 py-6">
                            {ref.status === 'bought' ? (
                              <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black uppercase tracking-tighter">Comprou</span>
                            ) : ref.status === 'not_bought' ? (
                              <span className="text-[8px] bg-neutral-100 text-neutral-500 px-2 py-1 rounded font-black uppercase tracking-tighter">Negada</span>
                            ) : (
                              <span className="text-[8px] bg-rose-50 text-rose-400 px-2 py-1 rounded font-black uppercase tracking-tighter">Pendente</span>
                            )}
                         </td>
                         <td className="px-8 py-6">
                            {ref.status === 'bought' ? (
                              ref.paidAt ? (
                                <span className="text-[8px] text-emerald-600 font-black uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Pago</span>
                              ) : (
                                <span className="text-[8px] text-amber-600 font-black uppercase bg-amber-50 px-2 py-1 rounded border border-amber-100 animate-pulse">Pendente</span>
                              )
                            ) : (
                              <span className="text-[8px] text-neutral-300 font-black uppercase">---</span>
                            )}
                         </td>
                         <td className="px-8 py-6 text-right space-x-1">
                           {ref.status === 'pending' && (
                             <div className="flex justify-end space-x-1">
                               <button 
                                 onClick={() => onUpdateReferralStatus(ref.id, 'bought')}
                                 className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1.5 rounded hover:bg-emerald-600"
                               >
                                 Comprou
                               </button>
                               <button 
                                 onClick={() => onUpdateReferralStatus(ref.id, 'not_bought')}
                                 className="bg-neutral-500 text-white text-[8px] font-black uppercase px-2 py-1.5 rounded hover:bg-neutral-600"
                               >
                                 X
                               </button>
                             </div>
                           )}
                           {ref.status === 'bought' && !ref.paidAt && (
                             <button 
                               onClick={() => { if(confirm('Confirmar pagamento de R$ '+ref.rewardValue+'?')) onPayCommission(ref.id); }}
                               className="bg-rose-600 text-white text-[8px] font-black uppercase px-3 py-2 rounded-lg hover:bg-rose-700 shadow-sm"
                             >
                               Confirmar Pagamento
                             </button>
                           )}
                         </td>
                       </tr>
                     );
                   }) : (<tr><td colSpan={6} className="px-8 py-20 text-center text-rose-200 italic font-bold uppercase tracking-widest text-xs">Nenhuma indicação registrada.</td></tr>)}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeMenu === 'produtos' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl space-y-12 pb-20">
            <header><h2 className="text-3xl font-light text-neutral-800 tracking-tight">Gerenciar <span className="font-bold text-rose-600">Produtos</span></h2><p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Cadastre os itens que podem ser indicados</p></header>
            
            <section className="bg-white p-10 rounded-3xl border border-rose-100 shadow-sm">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-8">Novo Produto</h3>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Nome do Produto</label>
                  <input required value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Ex: Kit 30 Dias" className="w-full px-5 py-3.5 bg-rose-50/30 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-rose-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Bônus de Indicação (R$)</label>
                  <input required type="number" step="0.01" value={newProdReward} onChange={(e) => setNewProdReward(e.target.value)} placeholder="0.00" className="w-full px-5 py-3.5 bg-rose-50/30 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-rose-500" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-[10px] shadow-lg">Cadastrar Produto</button>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest">
                   <tr>
                     <th className="px-8 py-5">Produto</th>
                     <th className="px-8 py-5">Valor do Bônus</th>
                     <th className="px-8 py-5 text-right">Excluir</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-rose-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-rose-50/20">
                        <td className="px-8 py-6 text-sm font-bold text-neutral-800 uppercase">{p.name}</td>
                        <td className="px-8 py-6 text-sm font-black text-emerald-600">R$ {p.reward.toFixed(2)}</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => onDeleteProduct(p.id)} className="text-neutral-300 hover:text-rose-600 transition-colors">
                            <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
