
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
  onUpdateClientPassword: (clientId: string, newPassword: string) => void;
  onDeleteClient: (clientId: string) => void;
  onUpdateReferralStatus: (referralId: string, status: ReferralStatus) => void;
  onPayCommission: (referralId: string) => void;
  onAddProduct: (name: string, reward: number) => void;
  onDeleteProduct: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  clients, entries, referrals, products, onLogout, onToggleClientActive, onUpdateAdminNotes, onUpdateClientPassword, onDeleteClient, onUpdateReferralStatus, onPayCommission, onAddProduct, onDeleteProduct
}) => {
  const [activeMenu, setActiveMenu] = useState<'acompanhamento' | 'habilitacao' | 'clientes' | 'indicacoes' | 'ranking' | 'produtos'>('acompanhamento');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile fecha por padrão
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [newProdName, setNewProdName] = useState('');
  const [newProdReward, setNewProdReward] = useState('');

  const getClientEntries = (clientId: string) => entries.filter(e => e.clientId === clientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const getClientStats = (client: Client) => {
    const clientEntries = entries.filter(e => e.clientId === client.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentWeight = clientEntries.length > 0 ? clientEntries[clientEntries.length - 1].weight : client.initialWeight;
    const totalLost = client.initialWeight - currentWeight;
    const progressPercent = Math.min(100, Math.max(0, (totalLost / (Math.max(0.1, client.initialWeight - client.targetWeight))) * 100));
    const weeksDiff = Math.max(1, (new Date().getTime() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7));
    return { currentWeight, totalLost, progressPercent, weeklyLoss: totalLost / weeksDiff };
  };

  const pendingClients = clients.filter(c => !c.active);
  const activeClients = clients.filter(c => c.active);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const totalWeightLost = activeClients.reduce((acc, c) => acc + getClientStats(c).totalLost, 0);
  const averageWeeklyLossGlobal = activeClients.length > 0 
    ? activeClients.reduce((acc, c) => acc + getClientStats(c).weeklyLoss, 0) / activeClients.length 
    : 0;

  const totalCommissionsPending = referrals
    .filter(r => r.status === 'bought' && !r.paidAt)
    .reduce((acc, r) => acc + r.rewardValue, 0);

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setTempNotes(client.adminNotes || '');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'acompanhamento', label: 'Evolução', icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { id: 'habilitacao', label: 'Novas Alunas', icon: <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />, badge: pendingClients.length },
    { id: 'clientes', label: 'Gestão de Contas', icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { id: 'ranking', label: 'Ranking', icon: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
    { id: 'indicacoes', label: 'Indicações', icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
    { id: 'produtos', label: 'Produtos', icon: <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> }
  ];

  return (
    <div className="flex min-h-screen bg-[#FFF9F9] font-inter relative">
      {/* Overlay Mobile Sidebar */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`bg-white border-r border-rose-100 flex flex-col transition-all duration-300 fixed lg:sticky top-0 h-screen z-[70] 
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-20'}`}>
        
        <div className="p-6 border-b border-rose-50 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <div className="lg:block hidden">
              {isSidebarOpen ? (
                <div><h1 className="text-sm font-bold text-neutral-800 italic">Painel <span className="text-rose-600">ADM</span></h1></div>
              ) : (
                <div className="w-full text-center"><span className="text-rose-600 font-black italic">R</span></div>
              )}
            </div>
          )}
          <div className="lg:hidden font-bold italic text-rose-600">MUSAS</div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
            <svg className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id as any); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase transition-all relative ${activeMenu === item.id ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
              {(isSidebarOpen || (window.innerWidth >= 1024 && isSidebarOpen)) && <span>{item.label}</span>}
              {isSidebarOpen && item.badge ? <span className="absolute right-3 bg-amber-400 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-50">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-bold text-neutral-300 hover:text-rose-600 uppercase">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 lg:p-12 w-full max-w-full overflow-x-hidden">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-light text-neutral-800">Painel <span className="font-bold text-rose-600 tracking-tighter">ADM</span></h2>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white border border-rose-100 rounded-lg text-rose-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </header>

        {activeMenu === 'acompanhamento' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { label: 'Ativas', val: activeClients.length },
                { label: 'KG OFF', val: totalWeightLost.toFixed(1), unit: 'kg', main: true },
                { label: 'Média/Sem', val: averageWeeklyLossGlobal.toFixed(2), highlight: true },
                { label: 'Pendentes', val: `R$ ${totalCommissionsPending.toFixed(0)}` }
              ].map((s, i) => (
                <div key={i} className={`p-4 sm:p-6 rounded-2xl border ${s.main ? 'bg-rose-600 text-white shadow-xl' : 'bg-white border-rose-100 shadow-sm'}`}>
                  <p className={`text-[8px] uppercase font-bold tracking-widest mb-2 ${s.main ? 'text-rose-100' : 'text-rose-300'}`}>{s.label}</p>
                  <h3 className="text-base sm:text-2xl font-bold">{s.val} <span className="text-[10px] font-light">{s.unit}</span></h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-1">
                <h3 className="text-[10px] font-bold text-neutral-800 uppercase tracking-widest mb-4">Minhas Alunas</h3>
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeClients.map(client => { 
                    const stats = getClientStats(client); 
                    return (
                      <button key={client.id} onClick={() => handleSelectClient(client)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedClientId === client.id ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-200' : 'border-rose-50 bg-white hover:border-rose-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-neutral-800 text-[10px] uppercase truncate">{client.name}</span>
                          <span className="text-[10px] font-black text-rose-600">-{stats.totalLost.toFixed(1)}k</span>
                        </div>
                      </button>
                    ); 
                  })}
                </div>
              </section>

              <section className="lg:col-span-2">
                {selectedClient ? (
                  <div className="bg-white p-6 sm:p-10 rounded-2xl border border-rose-100 shadow-sm space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-rose-50 pb-6">
                      <h3 className="text-xl font-bold text-neutral-800 uppercase">{selectedClient.name}</h3>
                      <div className="bg-rose-50 px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 uppercase">Média: {getClientStats(selectedClient).weeklyLoss.toFixed(2)}kg/sem</div>
                    </div>
                    <div className="h-64 sm:h-80"><WeightChart entries={getClientEntries(selectedClient.id)} targetWeight={selectedClient.targetWeight} initialWeight={selectedClient.initialWeight} /></div>
                    <div className="space-y-4 bg-rose-50/20 p-6 rounded-xl border border-rose-100">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Feedback Consultora</h4>
                      <textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full h-24 bg-white border border-rose-100 rounded-lg p-4 text-xs font-light outline-none" placeholder="Orientações..." />
                      <button onClick={() => { onUpdateAdminNotes(selectedClientId!, tempNotes); alert("Feedback enviado!"); }} className="w-full bg-rose-600 text-white text-[10px] font-bold py-4 rounded-lg uppercase tracking-widest shadow-lg">Salvar Nota</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-rose-200 border-2 border-dashed border-rose-100 rounded-2xl opacity-40 italic text-center p-8 text-[10px] uppercase font-bold tracking-widest">Selecione uma aluna</div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Tabelas Mobile-Friendly */}
        {activeMenu === 'clientes' && (
          <div className="space-y-6">
             <h2 className="text-xl font-bold text-rose-600 uppercase tracking-widest">Contas</h2>
             <div className="bg-white rounded-2xl border border-rose-100 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[600px]">
                   <thead className="bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest">
                      <tr><th className="px-6 py-4">Aluna</th><th className="px-6 py-4">Código</th><th className="px-6 py-4 text-right">Ações</th></tr>
                   </thead>
                   <tbody className="divide-y divide-rose-50">
                      {clients.map(client => (
                        <tr key={client.id} className="hover:bg-rose-50/20">
                           <td className="px-6 py-4 text-[10px] font-bold uppercase">{client.name}</td>
                           <td className="px-6 py-4 text-[10px] font-mono font-bold text-neutral-400">{client.password}</td>
                           <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => onUpdateClientPassword(client.id, prompt("Novo código?") || client.password)} className="text-[8px] bg-rose-50 text-rose-600 px-3 py-1.5 rounded uppercase font-black">Mudar</button>
                              <button onClick={() => onDeleteClient(client.id)} className="text-neutral-300 hover:text-rose-600"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeMenu === 'indicacoes' && (
          <div className="space-y-6">
             <h2 className="text-xl font-bold text-rose-600 uppercase tracking-widest">Indicações</h2>
             <div className="bg-white rounded-2xl border border-rose-100 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[700px]">
                   <thead className="bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest">
                      <tr><th className="px-6 py-4">Origem</th><th className="px-6 py-4">Indicada</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Pagamento</th></tr>
                   </thead>
                   <tbody className="divide-y divide-rose-50">
                      {referrals.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(ref => {
                         const referrer = clients.find(c => c.id === ref.referrerId);
                         return (
                          <tr key={ref.id}>
                            <td className="px-6 py-4 text-[10px] font-bold uppercase">{referrer?.name}</td>
                            <td className="px-6 py-4 text-[10px]">{ref.friendName}</td>
                            <td className="px-6 py-4 flex gap-1">
                               <button onClick={() => onUpdateReferralStatus(ref.id, 'bought')} className={`px-2 py-1 text-[7px] font-black uppercase rounded ${ref.status === 'bought' ? 'bg-emerald-500 text-white' : 'bg-neutral-100'}`}>Vendeu</button>
                               <button onClick={() => onUpdateReferralStatus(ref.id, 'not_bought')} className={`px-2 py-1 text-[7px] font-black uppercase rounded ${ref.status === 'not_bought' ? 'bg-rose-400 text-white' : 'bg-neutral-100'}`}>Não</button>
                            </td>
                            <td className="px-6 py-4 text-right">
                               {ref.status === 'bought' ? (ref.paidAt ? <span className="text-emerald-500 text-[8px] font-black">PAGO ✓</span> : <button onClick={() => onPayCommission(ref.id)} className="bg-emerald-600 text-white text-[8px] font-bold px-3 py-1.5 rounded shadow">PAGAR</button>) : '-'}
                            </td>
                          </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeMenu === 'produtos' && (
          <div className="space-y-8">
             <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
                <h3 className="text-[10px] font-black text-rose-600 uppercase mb-6">Novo Produto</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                   <input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="NOME" className="flex-1 px-4 py-3 bg-rose-50/50 rounded-xl text-xs font-bold" />
                   <input type="number" value={newProdReward} onChange={(e) => setNewProdReward(e.target.value)} placeholder="R$ 0.00" className="w-full sm:w-32 px-4 py-3 bg-rose-50/50 rounded-xl text-xs font-bold" />
                   <button onClick={() => { if(newProdName && newProdReward){ onAddProduct(newProdName, parseFloat(newProdReward)); setNewProdName(''); setNewProdReward(''); } }} className="bg-rose-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">OK</button>
                </div>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="bg-white p-4 rounded-xl border border-rose-100 flex justify-between items-center shadow-sm">
                    <div className="overflow-hidden"><p className="text-[10px] font-black uppercase truncate">{prod.name}</p><p className="text-[10px] text-rose-500 font-bold">R$ {prod.reward.toFixed(2)}</p></div>
                    <button onClick={() => onDeleteProduct(prod.id)} className="text-rose-200 hover:text-rose-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeMenu === 'habilitacao' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingClients.map(client => (
              <div key={client.id} className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                <div><p className="font-bold text-neutral-800 text-xs uppercase">{client.name}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => onToggleClientActive(client.id)} className="bg-rose-600 text-white text-[8px] font-bold px-4 py-2 rounded-lg uppercase shadow">Liberar</button>
                  <button onClick={() => onDeleteClient(client.id)} className="text-neutral-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                </div>
              </div>
            ))}
            {pendingClients.length === 0 && <div className="col-span-full py-12 text-center text-rose-200 italic text-[10px] uppercase font-bold">Nenhuma solicitação pendente</div>}
          </div>
        )}

        {activeMenu === 'ranking' && <RankingView clients={activeClients} entries={entries} />}
      </main>
    </div>
  );
};

export default AdminDashboard;
