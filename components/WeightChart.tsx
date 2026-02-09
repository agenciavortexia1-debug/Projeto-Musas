
import React from 'react';
import { 
  LineChart, 
  Line, 
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
}

const WeightChart: React.FC<WeightChartProps> = ({ entries, targetWeight, initialWeight }) => {
  // Ordenar e formatar dados
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const data = sortedEntries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: entry.weight,
  }));

  // Calcular limites do Eixo Y para que a meta e o inicial sempre apareçam
  const allWeights = [...entries.map(e => e.weight), initialWeight, targetWeight];
  const minW = Math.min(...allWeights);
  const maxW = Math.max(...allWeights);
  const domainPadding = (maxW - minW) * 0.2 || 2;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#db2777" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fdf2f2" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            domain={[Math.floor(minW - domainPadding), Math.ceil(maxW + domainPadding)]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '12px'
            }}
            itemStyle={{ color: '#db2777', fontWeight: 'bold' }}
            labelStyle={{ marginBottom: '4px', fontWeight: 'bold', color: '#374151' }}
          />
          
          {/* Área de Objetivo (Sombra suave indicando a meta) */}
          <ReferenceArea 
            y1={targetWeight - 0.5} 
            y2={targetWeight + 0.5} 
            fill="#fbcfe8" 
            fillOpacity={0.2} 
          />

          {/* Linha de Meta com etiqueta destacada */}
          <ReferenceLine 
            y={targetWeight} 
            stroke="#db2777" 
            strokeDasharray="5 5" 
            strokeWidth={1}
            label={{ 
              value: `OBJETIVO: ${targetWeight}kg`, 
              position: 'insideBottomRight', 
              fill: '#db2777', 
              fontSize: 9, 
              fontWeight: 'bold',
              offset: 10
            }} 
          />

          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#db2777" 
            strokeWidth={3} 
            dot={{ r: 5, fill: '#db2777', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
