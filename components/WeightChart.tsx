
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { WeightEntry } from '../types';

interface WeightChartProps {
  entries: WeightEntry[];
  targetWeight: number;
  initialWeight: number;
  startDate: string;
}

const WeightChart: React.FC<WeightChartProps> = ({ entries, targetWeight, initialWeight, startDate }) => {
  // 1. Preparar os dados combinando o peso inicial do cadastro com os check-ins
  const rawData = [
    {
      timestamp: new Date(startDate).getTime(),
      weight: initialWeight,
      isInitial: true
    },
    ...entries.map(e => ({
      timestamp: new Date(e.date).getTime(),
      weight: e.weight,
      isInitial: false
    }))
  ];

  // 2. Ordenar por tempo e remover duplicidade visual se houver registros no mesmo ms
  const sortedData = rawData.sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return a.isInitial ? -1 : 1;
    }
    return a.timestamp - b.timestamp;
  });

  // 3. Formatar os dados
  const processedData = sortedData.map(item => ({
    ...item,
    displayDate: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  // Calcular limites do Eixo Y para foco na variação
  const allWeights = [...processedData.map(d => d.weight), targetWeight];
  const minW = Math.min(...allWeights);
  const maxW = Math.max(...allWeights);
  const domainPadding = (maxW - minW) * 0.25 || 8;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={processedData} 
          margin={{ top: 20, right: 30, left: -15, bottom: 20 }}
        >
          <defs>
            {/* Gradiente para o preenchimento abaixo da linha */}
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#db2777" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
            </linearGradient>
            
            {/* Filtro de brilho/sombra suave para a linha */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#fdf2f2" strokeOpacity={0.8} />
          
          <XAxis 
            dataKey="timestamp" 
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
            padding={{ left: 40, right: 40 }}
          />
          
          <YAxis 
            domain={[Math.floor(minW - domainPadding), Math.ceil(maxW + domainPadding)]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
          />
          
          <Tooltip 
            labelFormatter={(unixTime) => `Data: ${new Date(unixTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso Atual"]}
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              boxShadow: '0 20px 40px -10px rgba(219, 39, 119, 0.2)',
              padding: '16px'
            }}
            itemStyle={{ color: '#db2777', fontWeight: '900', fontSize: '14px' }}
            labelStyle={{ marginBottom: '6px', fontWeight: 'bold', color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          
          <ReferenceArea 
            y1={targetWeight - 0.05} 
            y2={targetWeight + 0.05} 
            fill="#fbcfe8" 
            fillOpacity={0.2} 
          />

          <ReferenceLine 
            y={targetWeight} 
            stroke="#db2777" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            strokeOpacity={0.2}
            label={{ 
              value: `META: ${targetWeight}kg`, 
              position: 'insideBottomRight', 
              fill: '#db2777', 
              fontSize: 10, 
              fontWeight: '900',
              offset: 15,
              style: { opacity: 0.6 }
            }} 
          />

          <Area 
            type="monotone" 
            dataKey="weight" 
            stroke="#db2777" 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorWeight)" 
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
            dot={{ 
              r: 5, 
              fill: '#fff', 
              strokeWidth: 3, 
              stroke: '#db2777',
              fillOpacity: 1
            }}
            activeDot={{ 
              r: 8, 
              fill: '#db2777', 
              strokeWidth: 4, 
              stroke: '#fff',
              shadow: '0 0 15px rgba(219, 39, 119, 0.5)'
            }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
