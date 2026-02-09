
import React from 'react';
import { Client, WeightEntry } from '../types';

interface RankingViewProps {
  clients: Client[];
  entries: WeightEntry[];
  currentClientId?: string;
}

interface RankItem {
  clientId: string;
  name: string;
  profileImage?: string;
  loss: number;
}

const RankingView: React.FC<RankingViewProps> = ({ clients, entries, currentClientId }) => {
  const calculateLoss = (days: number): RankItem[] => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return clients
      .filter(c => c.active)
      .map(client => {
        const clientEntries = entries
          .filter(e => e.clientId === client.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (clientEntries.length === 0) return { clientId: client.id, name: client.name, profileImage: client.profileImage, loss: 0 };

        const latestWeight = clientEntries[clientEntries.length - 1].weight;
        
        const entriesBeforeCutoff = clientEntries.filter(e => new Date(e.date) < cutoff);
        const referenceWeight = entriesBeforeCutoff.length > 0 
          ? entriesBeforeCutoff[entriesBeforeCutoff.length - 1].weight 
          : client.initialWeight;

        const loss = referenceWeight - latestWeight;
        return { clientId: client.id, name: client.name, profileImage: client.profileImage, loss: loss > 0 ? loss : 0 };
      })
      .sort((a, b) => b.loss - a.loss);
  };

  const weeklyRanking = calculateLoss(7);
  const monthlyRanking = calculateLoss(30);

  const RankingSection = ({ title, data, icon }: { title: string, data: RankItem[], icon: React.ReactNode }) => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose-100/50 flex flex-col h-full">
      <div className="flex items-center space-x-3 mb-8 border-b border-rose-50 pb-4">
        <div className="text-rose-500">{icon}</div>
        <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {data.map((item, index) => {
          const isMe = item.clientId === currentClientId;
          const isTop3 = index < 3;
          
          return (
            <div 
              key={item.clientId} 
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                isMe ? 'bg-rose-600 text-white shadow-lg scale-[1.02]' : 'bg-rose-50/30 border border-rose-100/50 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                  isTop3 && !isMe ? 'bg-amber-400 text-white' : isMe ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-400'
                }`}>
                  {index + 1}º
                </div>
                
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-rose-50 flex-shrink-0">
                  {item.profileImage ? (
                    <img src={item.profileImage} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-300 text-[10px] font-bold uppercase">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <p className={`text-[11px] font-bold uppercase tracking-tight truncate ${isMe ? 'text-white' : 'text-neutral-800'}`}>
                    {item.name} {isMe && "(VOCÊ)"}
                  </p>
                  <p className={`text-[9px] uppercase tracking-widest truncate ${isMe ? 'text-rose-100' : 'text-rose-300'}`}>
                    Focada no objetivo
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <p className={`text-sm font-black ${isMe ? 'text-white' : 'text-rose-600'}`}>
                  -{item.loss.toFixed(1)}kg
                </p>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-center py-10 text-rose-200 italic text-xs uppercase tracking-widest font-bold">Iniciando a competição...</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RankingSection 
        title="Ranking Semanal" 
        data={weeklyRanking} 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
      />
      <RankingSection 
        title="Ranking Mensal" 
        data={monthlyRanking} 
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
    </div>
  );
};

export default RankingView;
