
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
  
  // Funções Auxiliares de Data
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) a 6 (Sab)
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para Segunda
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getStartOfFourWeeks = () => {
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    fourWeeksAgo.setHours(0, 0, 0, 0);
    return fourWeeksAgo;
  };

  const calculateRanking = (type: 'weekly' | 'monthly' | 'global', limit: number): RankItem[] => {
    const weekStart = getStartOfWeek();
    const monthStart = getStartOfFourWeeks();

    return clients
      .filter(c => c.active)
      .map(client => {
        const clientEntries = entries
          .filter(e => e.clientId === client.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (clientEntries.length === 0 && type !== 'global') {
          return { clientId: client.id, name: client.name, profileImage: client.profileImage, loss: 0 };
        }

        const latestWeight = clientEntries.length > 0 
          ? clientEntries[clientEntries.length - 1].weight 
          : client.initialWeight;

        let referenceWeight = client.initialWeight;

        if (type === 'weekly') {
          // Achar o peso logo antes da segunda-feira ou o primeiro da semana
          const beforeWeek = clientEntries.filter(e => new Date(e.date) < weekStart);
          const duringWeek = clientEntries.filter(e => new Date(e.date) >= weekStart);
          
          if (duringWeek.length === 0) return { clientId: client.id, name: client.name, profileImage: client.profileImage, loss: 0 };
          
          referenceWeight = beforeWeek.length > 0 
            ? beforeWeek[beforeWeek.length - 1].weight 
            : duringWeek[0].weight; // Se começou na semana, usa o primeiro registro dela
        } 
        else if (type === 'monthly') {
          const beforeMonth = clientEntries.filter(e => new Date(e.date) < monthStart);
          const duringMonth = clientEntries.filter(e => new Date(e.date) >= monthStart);
          
          if (duringMonth.length === 0) return { clientId: client.id, name: client.name, profileImage: client.profileImage, loss: 0 };

          referenceWeight = beforeMonth.length > 0 
            ? beforeMonth[beforeMonth.length - 1].weight 
            : duringMonth[0].weight;
        }
        else {
          // Global: Peso Inicial do Cadastro vs Último Registro
          referenceWeight = client.initialWeight;
        }

        const loss = referenceWeight - latestWeight;
        return { 
          clientId: client.id, 
          name: client.name, 
          profileImage: client.profileImage, 
          loss: loss > 0 ? loss : 0 
        };
      })
      .sort((a, b) => b.loss - a.loss)
      .slice(0, limit);
  };

  const weeklyRanking = calculateRanking('weekly', 3);
  const monthlyRanking = calculateRanking('monthly', 5);
  const globalRanking = calculateRanking('global', 10);

  const RankingSection = ({ title, data, icon, color, subtitle }: { title: string, data: RankItem[], icon: React.ReactNode, color: string, subtitle: string }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100/50 flex flex-col h-full transition-all hover:shadow-md">
      <div className="flex items-center space-x-3 mb-6 border-b border-rose-50 pb-4">
        <div className={color}>{icon}</div>
        <div>
          <h3 className="text-[10px] font-black text-neutral-800 uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-[8px] text-neutral-400 uppercase font-bold tracking-widest">{subtitle}</p>
        </div>
      </div>
      
      <div className="space-y-3 overflow-y-auto custom-scrollbar">
        {data.map((item, index) => {
          const isMe = item.clientId === currentClientId;
          const isTop3 = index < 3;
          
          return (
            <div 
              key={item.clientId} 
              className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                isMe ? 'bg-rose-600 text-white shadow-lg scale-[1.02] z-10' : 'bg-rose-50/30 border border-rose-100/50 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] flex-shrink-0 ${
                  index === 0 && !isMe ? 'bg-amber-400 text-white' : 
                  index === 1 && !isMe ? 'bg-slate-300 text-white' :
                  index === 2 && !isMe ? 'bg-amber-600 text-white' :
                  isMe ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-400'
                }`}>
                  {index + 1}º
                </div>
                
                <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-rose-50 flex-shrink-0">
                  {item.profileImage ? (
                    <img src={item.profileImage} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-300 text-[10px] font-bold uppercase">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isMe ? 'text-white' : 'text-neutral-800'}`}>
                    {item.name} {isMe && "★"}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <p className={`text-xs font-black ${isMe ? 'text-white' : 'text-rose-600'}`}>
                  -{item.loss.toFixed(1)}kg
                </p>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-rose-200 italic text-[9px] uppercase tracking-widest font-bold">Aguardando registros...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RankingSection 
          title="Top 3 da Semana" 
          subtitle="Ciclo: Seg a Dom"
          data={weeklyRanking} 
          color="text-amber-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>}
        />
        <RankingSection 
          title="Top 5 Mensal" 
          subtitle="Ciclo: 4 Semanas"
          data={monthlyRanking} 
          color="text-rose-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <RankingSection 
          title="Top 10 Musas" 
          subtitle="Ranking Eterno"
          data={globalRanking} 
          color="text-indigo-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zM7 21a5 5 0 0110 0H7z" /></svg>}
        />
      </div>
    </div>
  );
};

export default RankingView;
