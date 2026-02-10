
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
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
  const averageWeeklyLossGlobal = activeClients.length > 0 
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
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSaveNotes = () => {
    if (selectedClientId) {
      onUpdateAdminNotes(selectedClientId, tempNotes);
      alert('Notas de consultoria publicadas!');
    }
  };

  const handlePasswordChange = (clientId: string) => {
    const newPass = prompt('Digite o novo código de acesso para esta cliente:');
    if (newPass && newPass.trim().length > 0) {
      onUpdateClientPassword(clientId, newPass.trim());
    }
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
    <div className="flex min-h-screen bg-[#FFF9F9] font-inter relative overflow-x-hidden">
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Ampliada" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`bg-white border-r border-rose-100 flex flex-col transition-all duration-300 ease-in-out fixed lg:sticky top-0 h-screen z-50 w-72 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-rose-50 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-neutral-800 tracking-tighter italic">Painel <span className="text-rose-600 not-italic">ADM</span></h1>
            <p className="text-[8px] text-rose-300 uppercase tracking-widest font-black">@rosimar_emagrecedores</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 lg:hidden"><svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id as any); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeMenu === item.id ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
              <span>{item.label}</span>
              {item.badge ? <span className="absolute right-3 bg-amber-400 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-50">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-bold text-neutral-300 hover:text-rose-600 uppercase tracking-widest transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-neutral-800 tracking-tight">Painel de <span className="font-semibold text-rose-600">Gestão</span></h2>
            <p className="text-rose-300 text-[10px] uppercase tracking-widest font-bold mt-1">Olá, Rosimar</p>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden bg-white border border-rose-100 rounded-lg text-rose-500 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </header>

        {activeMenu === 'acompanhamento' && (
          <div className="space-y-8 pb-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Alunas Ativas', val: activeClients.length },
                { label: 'KG Eliminados', val: totalWeightLost.toFixed(1), unit: 'kg', main: true },
                { label: 'Média Semanal Perda', val: averageWeeklyLossGlobal.toFixed(2), unit: 'kg/sem', highlight: true },
                { label: 'Comissão Pendente', val: `R$ ${totalCommissionsPending.toFixed(2)}` }
              ].map((s, i) => (
                <div key={i} className={`p-6 rounded-2xl border transition-all ${s.main ? 'bg-rose-600 text-white shadow-xl shadow-rose-100' : s.highlight ? 'bg-white border-rose-500 shadow-md ring-1 ring-rose-100' : 'bg-white border-rose-100 shadow-sm'}`}>
                  <p className={`text-[9px] uppercase font-bold tracking-widest mb-4 ${s.main ? 'text-rose-100' : 'text-rose-300'}`}>{s.label}</p>
                  <h3 className={`text-xl sm:text-3xl font-bold ${s.highlight ? 'text-rose-600' : ''}`}>{s.val} <span className="text-xs sm:text-base opacity-30 font-light">{s.unit}</span></h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-1 space-y-4">
                <h3 className="text-[10px] font-bold text-neutral-800 uppercase tracking-[0.3em] border-l-4 border-rose-500 pl-4 mb-4">Acompanhar Aluna</h3>
                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeClients.map(client => { 
                    const stats = getClientStats(client); 
                    return (
                      <button key={client.id} onClick={() => handleSelectClient(client)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClientId === client.id ? 'border-rose-500 bg-rose-50' : 'border-rose-50 bg-white hover:border-rose-100 shadow-sm'}`}>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-neutral-800 text-[11px] uppercase truncate max-w-[120px]">{client.name}</span>
                          <span className="text-[10px] font-black text-rose-600">-{stats.totalLost.toFixed(1)}kg</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full" style={{ width: `${stats.progressPercent}%` }} />
                        </div>
                      </button>
                    ); 
                  })}
                </div>
              </section>

              <section className="lg:col-span-2">
                {selectedClient ? (
                  <div className="bg-white p-6 sm:p-10 rounded-2xl border border-rose-100 shadow-sm space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-rose-50 pb-6">
                      <div>
                        <h3 className="text-2xl font-light text-neutral-800">{selectedClient.name}</h3>
                        <p className="text-rose-300 text-[10px] uppercase tracking-widest mt-1">Total de registros: {getClientEntries(selectedClient.id).length}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[9px] text-rose-300 uppercase font-bold tracking-widest">Média Individual/Semana</p>
                        <p className="text-xl font-bold text-rose-600">{getClientStats(selectedClient).weeklyLoss.toFixed(2)}kg</p>
                      </div>
                    </div>
                    <WeightChart entries={getClientEntries(selectedClient.id)} targetWeight={selectedClient.targetWeight} initialWeight={selectedClient.initialWeight} />
                    <div className="space-y-4 bg-rose-50/20 p-8 rounded-xl border border-rose-100">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Acompanhamento Consultora</h4>
                      <textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full h-32 bg-white border border-rose-100 rounded-lg p-4 text-sm font-light outline-none focus:ring-1 focus:ring-rose-300 resize-none" placeholder="Escreva suas orientações aqui..." />
                      <button onClick={handleSaveNotes} className="w-full bg-rose-600 text-white text-xs font-bold py-4 rounded-lg hover:bg-rose-700 uppercase tracking-widest transition-all">Enviar Orientação</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-rose-200 border-2 border-dashed border-rose-100 rounded-2xl min-h-[400px] opacity-40 italic text-center p-8">
                    <p className="uppercase tracking-[0.4em] text-[10px] font-bold">Selecione uma aluna para iniciar a análise</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeMenu === 'clientes' && (
          <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto pb-20">
             <header>
                <h2 className="text-3xl font-light text-neutral-800 tracking-tight">Gestão de <span className="font-bold text-rose-600">Contas</span></h2>
                <p className="text-rose-300 text-xs uppercase tracking-widest font-bold mt-1">Administração de códigos de acesso</p>
             </header>

             <div className="bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Aluna</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Código (Senha)</th>
                        <th className="px-8 py-5 text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-rose-50">
                      {clients.map(client => (
                        <tr key={client.id} className="hover:bg-rose-50/20 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center space-x-3">
                                 <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-[10px] font-black">{client.name.charAt(0)}</div>
                                 <span className="text-xs font-bold text-neutral-800 uppercase truncate max-w-[200px]">{client.name}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest ${client.active ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {client.active ? 'Ativa' : 'Pendente'}
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-mono font-bold text-neutral-400 bg-neutral-50 px-3 py-1 rounded border border-neutral-100">
                                 {client.password}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right space-x-2">
                              <button onClick={() => handlePasswordChange(client.id)} className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 text-[9px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest shadow-sm transition-all">Alterar Código</button>
                              <button onClick={() => onDeleteClient(client.id)} className="text-neutral-200 hover:text-rose-600 transition-colors">
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Demais menus mantidos com lógica anterior adaptada */}
        {activeMenu === 'habilitacao' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-neutral-800 mb-10">Solicitações de <span className="font-bold text-rose-600">Acesso</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pendingClients.map(client => (
                <div key={client.id} className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all">
                  <div><p className="font-bold text-neutral-800 text-sm uppercase">{client.name}</p></div>
                  <div className="mt-8 flex space-x-3">
                    <button onClick={() => onToggleClientActive(client.id)} className="flex-1 bg-rose-600 text-white text-[10px] font-bold py-3 rounded-xl hover:bg-rose-700 uppercase tracking-widest shadow-md">Aprovar</button>
                    <button onClick={() => onDeleteClient(client.id)} className="px-4 bg-neutral-50 text-neutral-300 rounded-xl hover:text-rose-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMenu === 'ranking' && <RankingView clients={activeClients} entries={entries} />}
      </main>
    </div>
  );
};

export default AdminDashboard;
