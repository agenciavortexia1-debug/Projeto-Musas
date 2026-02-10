
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<string>('');
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('happy');
  const [notes, setNotes] = useState('');
  const [entryPhoto, setEntryPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [friendName, setFriendName] = useState('');
  const [friendContact, setFriendContact] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entryPhotoRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !entryPhoto) {
      alert('Peso e Foto são obrigatórios!');
      return;
    }
    onAddEntry({
      date: new Date().toISOString(),
      weight: parseFloat(newWeight.replace(',','.')),
      mood,
      notes,
      photo: entryPhoto
    });
    setNewWeight('');
    setNotes('');
    setEntryPhoto(null);
    setActiveTab('progress');
  };

  const handleEntryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setEntryPhoto(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        onUpdateProfileImage(client.id, compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : client.initialWeight;
  const progress = client.initialWeight - currentWeight;
  const targetDiff = currentWeight - client.targetWeight;

  const paidEarnings = referrals.filter(r => r.status === 'bought' && r.paidAt).reduce((acc, r) => acc + r.rewardValue, 0);
  const pendingCollection = referrals.filter(r => r.status === 'bought' && !r.paidAt).reduce((acc, r) => acc + r.rewardValue, 0);

  return (
    <div className="flex min-h-screen bg-[#FFF9F9] font-inter">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`bg-white border-r border-rose-100 flex flex-col transition-all duration-300 fixed lg:sticky top-0 h-screen z-[70] 
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-20'}
        ${!isSidebarOpen ? 'invisible lg:visible' : 'visible'}`}>
        
        <div className="p-6 border-b border-rose-50 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <div className="lg:block hidden">
              {isSidebarOpen ? (
                <div><h1 className="text-sm font-black italic text-rose-600">MUSAS</h1></div>
              ) : (
                <div className="w-full text-center text-rose-600 font-black italic">M</div>
              )}
            </div>
          )}
          <div className="lg:hidden font-black italic text-rose-600">MUSAS</div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-rose-400">
            <svg className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {[
            { id: 'progress', label: 'Jornada', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10' },
            { id: 'register', label: 'Check-in', icon: 'M12 4v16m8-8H4' },
            { id: 'ranking', label: 'Ranking', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'refer', label: 'Indicar', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
              {isSidebarOpen && <span>{tab.label}</span>}
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
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-light">Olá, <span className="font-bold text-rose-600">{client.name.split(' ')[0]}</span></h2>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full border-2 border-white shadow shadow-rose-100 overflow-hidden bg-rose-50 cursor-pointer">
              {client.profileImage ? <img src={client.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-rose-200 text-[10px] font-black">?</div>}
            </div>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-rose-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleProfileImageUpload} accept="image/*" className="hidden" />
        </header>

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { label: 'Inicial', val: client.initialWeight.toFixed(1) },
                { label: 'Atual', val: currentWeight.toFixed(1) },
                { label: 'Eliminados', val: progress.toFixed(1), main: true },
                { label: 'Falta', val: targetDiff > 0 ? targetDiff.toFixed(1) : '0' }
              ].map((s, i) => (
                <div key={i} className={`p-4 sm:p-6 rounded-2xl border ${s.main ? 'bg-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-white border-rose-100 shadow-sm'}`}>
                  <p className={`text-[8px] uppercase font-bold tracking-widest mb-1 ${s.main ? 'text-rose-100' : 'text-rose-300'}`}>{s.label}</p>
                  <h3 className="text-base sm:text-2xl font-bold">{s.val}kg</h3>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border-l-8 border-rose-500 shadow-sm">
               <h4 className="text-[8px] font-black uppercase text-rose-500 mb-2 tracking-[0.2em]">Nota da Rosimar</h4>
               <p className="text-neutral-700 italic text-sm font-light leading-relaxed">"{client.adminNotes || 'Siga firme!'}"</p>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-2xl border border-rose-100 h-[300px] sm:h-[400px]">
               <h3 className="text-[10px] font-black uppercase text-neutral-800 mb-6 tracking-widest">Sua Evolução</h3>
               <WeightChart entries={entries} targetWeight={client.targetWeight} initialWeight={client.initialWeight} />
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto">
             <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-2xl border border-rose-100 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase text-rose-600 tracking-widest text-center">Peso da Semana</h3>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-rose-300 tracking-widest">Peso (kg)</label>
                   <input type="number" step="0.1" required value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full px-4 py-3 bg-rose-50/50 rounded-xl outline-none text-base font-bold" placeholder="0.0" />
                </div>

                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-rose-300 tracking-widest">Foto Obrigatória</label>
                   <div onClick={() => !isCompressing && entryPhotoRef.current?.click()} className={`w-full h-40 border-2 border-dashed border-rose-100 rounded-2xl flex items-center justify-center cursor-pointer bg-rose-50/20 overflow-hidden relative transition-all ${isCompressing ? 'opacity-50 grayscale' : ''}`}>
                      {isCompressing ? (
                         <div className="text-center">
                            <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-[8px] font-black uppercase text-rose-400">Otimizando Foto...</p>
                         </div>
                      ) : entryPhoto ? (
                        <img src={entryPhoto} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-rose-200 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          <p className="text-[8px] font-black uppercase text-rose-300">Câmera ou Galeria</p>
                        </div>
                      )}
                   </div>
                   <input type="file" accept="image/*" ref={entryPhotoRef} onChange={handleEntryPhotoUpload} className="hidden" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                   {(['happy', 'neutral', 'sad'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setMood(m)} className={`py-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${mood === m ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-300'}`}>{m === 'happy' ? 'Radiante' : m === 'neutral' ? 'Bem' : 'Dificil'}</button>
                   ))}
                </div>

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-24 bg-rose-50/20 rounded-xl p-4 text-xs outline-none" placeholder="Como foi sua semana?" />
                <button type="submit" disabled={isCompressing} className={`w-full bg-rose-600 text-white font-black py-5 rounded-xl text-[10px] uppercase shadow-xl shadow-rose-100 tracking-widest ${isCompressing ? 'opacity-50' : ''}`}>Confirmar Registro</button>
             </form>
          </div>
        )}

        {activeTab === 'ranking' && <RankingView clients={allClients} entries={allEntries} currentClientId={client.id} />}

        {activeTab === 'refer' && (
          <div className="space-y-8 max-w-2xl mx-auto">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-600 p-6 rounded-2xl text-white shadow-xl"><p className="text-[8px] font-black uppercase opacity-60 mb-2">Ganhos Pagos</p><h3 className="text-xl font-black">R$ {paidEarnings.toFixed(2)}</h3></div>
                <div className="bg-white p-6 rounded-2xl border border-rose-100"><p className="text-[8px] font-black uppercase text-rose-300 mb-2">A Receber</p><h3 className="text-xl font-black text-rose-600">R$ {pendingCollection.toFixed(2)}</h3></div>
             </div>

             <form onSubmit={(e) => { e.preventDefault(); onAddReferral(friendName, friendContact, selectedProductId); setFriendName(''); setFriendContact(''); setSelectedProductId(''); alert("Enviado!"); }} className="bg-white p-6 sm:p-10 rounded-2xl border border-rose-100 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase text-rose-600 tracking-widest text-center">Indicar Amiga</h3>
                <input required value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="NOME DA AMIGA" className="w-full px-4 py-3 bg-rose-50/30 rounded-xl outline-none text-xs font-bold" />
                <input required value={friendContact} onChange={(e) => setFriendContact(e.target.value)} placeholder="WHATSAPP" className="w-full px-4 py-3 bg-rose-50/30 rounded-xl outline-none text-xs font-bold" />
                <select required value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-4 py-3 bg-rose-50/30 rounded-xl outline-none text-xs font-bold appearance-none">
                   <option value="">SELECIONE O PRODUTO</option>
                   {products.map(p => <option key={p.id} value={p.id}>{p.name} - Bônus: R$ {p.reward.toFixed(0)}</option>)}
                </select>
                <button type="submit" className="w-full bg-rose-600 text-white font-black py-4 rounded-xl text-[10px] uppercase shadow-lg tracking-widest">Enviar Indicação</button>
             </form>

             <div className="space-y-3 pb-20">
                <h4 className="text-[10px] font-black uppercase text-neutral-800">Suas Indicações</h4>
                {referrals.map(ref => (
                   <div key={ref.id} className="bg-white p-4 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                      <div className="overflow-hidden"><p className="text-[10px] font-black uppercase truncate">{ref.friendName}</p><p className="text-[8px] font-bold text-rose-400">{ref.productName}</p></div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-rose-600">R$ {ref.rewardValue.toFixed(0)}</p>
                         <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${
                           ref.paidAt ? 'bg-emerald-50 text-emerald-600' : 
                           ref.status === 'not_bought' ? 'bg-neutral-100 text-neutral-400' : 
                           'bg-rose-50 text-rose-400'
                         }`}>
                           {ref.paidAt ? 'Pago' : 
                            ref.status === 'bought' ? 'A Receber' : 
                            ref.status === 'not_bought' ? 'Indicação Rejeitada' : 
                            'Em análise'}
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
