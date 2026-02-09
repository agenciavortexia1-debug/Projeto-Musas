
import React, { useState, useRef } from 'react';
import { Client, WeightEntry, Referral, Product } from '../types';
import WeightChart from './WeightChart';
import RankingView from './RankingView';

interface ClientDashboardProps {
  client: Client;
  entries: WeightEntry[];
  referrals: Referral[];
  products: Product[];
  allClients?: Client[];
  allEntries?: WeightEntry[];
  onAddEntry: (entry: Omit<WeightEntry, 'id' | 'clientId'>) => void;
  onAddReferral: (friendName: string, friendContact: string, productId: string) => void;
  onUpdateProfileImage: (clientId: string, base64: string) => void;
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  client, entries, referrals, products, allClients = [], allEntries = [], onAddEntry, onAddReferral, onUpdateProfileImage, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'progress' | 'refer' | 'ranking'>('progress');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [newWeight, setNewWeight] = useState<string>('');
  const [newWaist, setNewWaist] = useState<string>('');
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('happy');
  const [notes, setNotes] = useState('');
  const [entryPhoto, setEntryPhoto] = useState<string | null>(null);

  const [friendName, setFriendName] = useState('');
  const [friendContact, setFriendContact] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entryPhotoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !entryPhoto) {
      alert('Peso e Foto são obrigatórios para validação!');
      return;
    }
    onAddEntry({
      date: new Date().toISOString(),
      weight: parseFloat(newWeight),
      waist: newWaist ? parseFloat(newWaist) : undefined,
      mood,
      notes,
      photo: entryPhoto
    });
    setNewWeight('');
    setNewWaist('');
    setNotes('');
    setEntryPhoto(null);
    setActiveTab('progress');
  };

  const handleEntryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEntryPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !friendContact || !selectedProductId) {
      alert('Por favor, preencha todos os campos e selecione um produto.');
      return;
    }
    onAddReferral(friendName, friendContact, selectedProductId);
    setFriendName('');
    setFriendContact('');
    setSelectedProductId('');
    alert('Indicação enviada para Rosimar! Assim que a venda for concluída, seus créditos aparecerão aqui.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfileImage(client.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : client.initialWeight;
  const progress = client.initialWeight - currentWeight;
  const targetDiff = currentWeight - client.targetWeight;

  const paidEarnings = referrals
    .filter(r => r.status === 'bought' && r.paidAt)
    .reduce((acc, r) => acc + r.rewardValue, 0);

  const pendingCollection = referrals
    .filter(r => r.status === 'bought' && !r.paidAt)
    .reduce((acc, r) => acc + r.rewardValue, 0);

  const totalPossible = referrals
    .filter(r => r.status === 'pending')
    .reduce((acc, r) => acc + r.rewardValue, 0);

  return (
    <div className="flex min-h-screen bg-[#FFF9F9] font-sans">
      <aside className={`bg-white border-r border-rose-100 flex flex-col transition-all duration-300 ease-in-out fixed h-full z-20 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-8 border-b border-rose-50 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-xl font-bold text-neutral-800 tracking-tighter italic">Projeto <span className="text-rose-600 not-italic">Musas</span></h1>
              <p className="text-[10px] text-rose-300 uppercase tracking-[0.3em] font-bold mt-1">@rosimar_emagrecedores</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-rose-50 text-rose-400 transition-colors">
            <svg className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('progress')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'progress' ? 'bg-rose-50 text-rose-700 shadow-sm border-r-4 border-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {isSidebarOpen && <span>Minha Jornada</span>}
          </button>
          
          <button onClick={() => setActiveTab('register')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-rose-50 text-rose-700 shadow-sm border-r-4 border-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {isSidebarOpen && <span>Novo Registro</span>}
          </button>

          <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'ranking' ? 'bg-rose-50 text-rose-700 shadow-sm border-r-4 border-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            {isSidebarOpen && <span>Ranking Geral</span>}
          </button>

          <button onClick={() => setActiveTab('refer')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'refer' ? 'bg-rose-50 text-rose-700 shadow-sm border-r-4 border-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {isSidebarOpen && <span>Indicações & Ganhos</span>}
          </button>
        </nav>

        <div className="p-6 border-t border-rose-50">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold text-neutral-300 hover:text-rose-600 transition-colors uppercase tracking-widest">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'} p-12 relative`}>
        <div className="absolute top-12 right-12 z-30">
          <div className="relative group">
            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer bg-rose-50 flex items-center justify-center transition-all hover:ring-4 hover:ring-rose-200">
              {client.profileImage ? <img src={client.profileImage} alt="Perfil" className="w-full h-full object-cover" /> : <div className="text-rose-200 flex flex-col items-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-[8px] font-bold uppercase mt-1">Foto</span></div>}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </div>

        <header className="mb-12">
          <h2 className="text-3xl font-light text-neutral-800 tracking-tight">Bem-vinda, <span className="font-semibold text-rose-600">{client.name}</span></h2>
          <p className="text-rose-300 text-sm uppercase tracking-widest mt-1">Consultoria @rosimar_emagrecedores</p>
        </header>

        {activeTab === 'progress' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100/50"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-4">Peso Inicial</p><h3 className="text-3xl font-light text-neutral-800">{client.initialWeight.toFixed(1)} <span className="text-base opacity-30">kg</span></h3></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100/50"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-4">Peso Atual</p><h3 className="text-3xl font-light text-neutral-800">{currentWeight.toFixed(1)} <span className="text-base opacity-30">kg</span></h3></div>
              <div className="bg-rose-600 p-6 rounded-2xl shadow-xl shadow-rose-100 text-white"><p className="text-rose-100 text-[10px] uppercase font-bold tracking-widest mb-4">Eliminados</p><h3 className="text-3xl font-bold">-{progress.toFixed(1)} <span className="text-base font-light opacity-60">kg</span></h3></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100/50"><p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-4">Para a Meta</p><h3 className="text-3xl font-light text-neutral-800">{targetDiff > 0 ? targetDiff.toFixed(1) : 0} <span className="text-base opacity-30">kg</span></h3></div>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-rose-100 relative overflow-hidden border-l-8 border-rose-500"><div className="relative z-10 flex items-start space-x-8"><div className="w-14 h-14 bg-rose-50 border border-rose-200 flex items-center justify-center rounded-full flex-shrink-0"><span className="text-rose-600 text-xl font-serif italic font-bold">R</span></div><div><h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-500 mb-3">Notas da Consultora Rosimar</h4><p className="text-neutral-700 leading-relaxed font-light text-xl italic whitespace-pre-line">"{client.adminNotes || 'Suas orientações aparecerão aqui em breve!'}"</p></div></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100/50"><h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-8 border-l-4 border-rose-500 pl-4">Evolução de Peso</h3><WeightChart entries={entries} targetWeight={client.targetWeight} initialWeight={client.initialWeight} /></section>
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100/50 flex flex-col h-[400px]"><h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-8 border-l-4 border-rose-500 pl-4">Linha do Tempo</h3><div className="space-y-6 overflow-y-auto pr-2 flex-1 custom-scrollbar">{entries.length > 0 ? [...entries].reverse().map((entry) => (<div key={entry.id} className="relative pl-6 border-l border-rose-100 pb-4 last:pb-0 group"><div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50"></div><div className="flex justify-between items-baseline mb-1"><span className="text-lg font-light text-neutral-800">{entry.weight.toFixed(1)}kg</span><span className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('pt-BR')}</span></div>{entry.notes && <p className="text-xs text-neutral-400 font-light italic leading-relaxed">"{entry.notes}"</p>}</div>)) : (<div className="h-full flex flex-col items-center justify-center opacity-30 italic text-rose-300"><p className="text-xs uppercase tracking-widest">Aguardando seu primeiro registro...</p></div>)}</div></section>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="max-w-2xl animate-in fade-in slide-in-from-left-4 duration-500">
            <section className="bg-white p-12 rounded-2xl shadow-sm border border-rose-100/50"><h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-10 border-l-4 border-rose-500 pl-4">Novo Check-in Semanal</h3><form onSubmit={handleSubmit} className="space-y-8"><div className="grid grid-cols-1 sm:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Peso Atual (kg)</label><input type="number" step="0.1" required value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none text-xl font-light" placeholder="0.0" /></div><div className="space-y-2"><label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Cintura (cm)</label><input type="number" value={newWaist} onChange={(e) => setNewWaist(e.target.value)} className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none text-xl font-light" placeholder="Opcional" /></div></div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Foto de Validação (Obrigatória)</label>
                  <div 
                    onClick={() => entryPhotoRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-rose-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-rose-50/20 hover:bg-rose-50/40 transition-all overflow-hidden relative"
                  >
                    {entryPhoto ? (
                      <img src={entryPhoto} alt="Validação" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <svg className="w-10 h-10 text-rose-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Clique para tirar foto ou selecionar</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" capture="environment" ref={entryPhotoRef} onChange={handleEntryPhotoUpload} className="hidden" required />
                </div>
                <div className="space-y-4"><label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Bem-estar</label><div className="grid grid-cols-3 gap-4">{(['happy', 'neutral', 'sad'] as const).map((m) => (<button key={m} type="button" onClick={() => setMood(m)} className={`py-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${mood === m ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-300'}`}>{m === 'happy' ? 'Radiante' : m === 'neutral' ? 'Estável' : 'Desafiada'}</button>))}</div></div><div className="space-y-2"><label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Relato da Semana</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none h-32 resize-none text-sm leading-relaxed font-light" placeholder="Conte como foi sua jornada..." /></div><button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-rose-100">Confirmar Registro</button></form></section>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <RankingView clients={allClients} entries={allEntries} currentClientId={client.id} />
          </div>
        )}

        {activeTab === 'refer' && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 pb-20">
            {/* Dashboard de Ganhos */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-8 rounded-3xl shadow-xl shadow-rose-100 text-white relative overflow-hidden md:col-span-1">
                <p className="text-rose-100 text-[10px] uppercase font-bold tracking-[0.3em] mb-4">Recebido</p>
                <h3 className="text-3xl font-black">R$ {paidEarnings.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm md:col-span-1">
                <p className="text-rose-300 text-[10px] uppercase font-bold tracking-[0.3em] mb-4">A Receber</p>
                <h3 className="text-2xl font-black text-rose-600">R$ {pendingCollection.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm md:col-span-1">
                <p className="text-rose-300 text-[10px] uppercase font-bold tracking-[0.3em] mb-4">Possível</p>
                <h3 className="text-2xl font-light text-neutral-800">R$ {totalPossible.toFixed(2)}</h3>
                <p className="text-[9px] text-neutral-400 mt-2 uppercase tracking-widest">Em Análise</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm md:col-span-1">
                <p className="text-rose-300 text-[10px] uppercase font-bold tracking-widest mb-4">Indicações</p>
                <h3 className="text-3xl font-light text-neutral-800">{referrals.length}</h3>
              </div>
            </section>

            <section className="bg-white p-12 rounded-3xl shadow-sm border border-rose-100/50">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-10 border-l-4 border-rose-500 pl-4">Indicar uma Amiga</h3>
              <p className="text-neutral-400 text-sm font-light mb-8">Indique amigas interessadas em nossos produtos. Cada venda concluída gera créditos para você!</p>
              
              <form onSubmit={handleReferral} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Nome da Amiga</label>
                    <input required value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="NOME COMPLETO" className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Contato (WhatsApp)</label>
                    <input required value={friendContact} onChange={(e) => setFriendContact(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Produto Desejado</label>
                  <select 
                    required 
                    value={selectedProductId} 
                    onChange={(e) => setSelectedProductId(e.target.value)} 
                    className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-xl outline-none text-xs font-bold focus:ring-1 focus:ring-rose-500 appearance-none"
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - Bônus: R$ {p.reward.toFixed(2)}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full bg-rose-600 text-white font-bold py-5 rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs shadow-lg">Enviar Indicação</button>
              </form>
            </section>

            <section className="bg-white p-12 rounded-3xl shadow-sm border border-rose-100/50">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-8 border-l-4 border-rose-500 pl-4">Histórico de Indicações</h3>
              <div className="space-y-4">
                {referrals.length > 0 ? referrals.map(ref => (
                  <div key={ref.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-rose-50/20 rounded-2xl border border-rose-100 gap-4">
                    <div className="flex items-center space-x-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${ref.status === 'bought' ? 'bg-emerald-500 text-white' : ref.status === 'not_bought' ? 'bg-neutral-300 text-white' : 'bg-rose-100 text-rose-400'}`}>
                         {ref.friendName.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-neutral-800 uppercase tracking-tight">{ref.friendName}</p>
                         <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-medium">Interesse: <span className="text-rose-400 font-bold">{ref.productName}</span></p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <p className="text-[9px] text-neutral-400 uppercase tracking-widest">Bônus</p>
                        <p className={`text-sm font-black ${ref.status === 'bought' ? 'text-emerald-600' : 'text-rose-300'}`}>R$ {ref.rewardValue.toFixed(2)}</p>
                      </div>
                      <div className="min-w-[120px] flex justify-end">
                        {ref.status === 'bought' ? (
                          ref.paidAt ? (
                            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
                               <span className="text-[9px] font-black uppercase tracking-widest">Crédito Pago</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full border border-amber-100">
                               <span className="text-[9px] font-black uppercase tracking-widest">A Receber</span>
                            </div>
                          )
                        ) : ref.status === 'not_bought' ? (
                          <div className="bg-neutral-100 text-neutral-400 px-4 py-2 rounded-full border border-neutral-200">
                            <span className="text-[9px] font-bold uppercase tracking-widest">Não Comprou</span>
                          </div>
                        ) : (
                          <div className="bg-rose-50 text-rose-300 px-4 py-2 rounded-full border border-rose-100">
                            <span className="text-[9px] font-bold uppercase tracking-widest">Em análise</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-12 text-rose-200 italic uppercase tracking-widest text-[10px] font-bold">Você ainda não indicou nenhuma amiga.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
