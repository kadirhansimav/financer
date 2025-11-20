
import React from 'react';
import { TrendingUp, Coins, DollarSign, Euro } from 'lucide-react';
import { MarketData } from '../types';

interface MarketRatesProps {
  rates: MarketData | null;
  isLoading: boolean;
}

export const MarketRates: React.FC<MarketRatesProps> = ({ rates, isLoading }) => {
  if (!rates && !isLoading) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <RateCard 
        title="Gram Altın" 
        value={rates?.gramGold} 
        icon={<Coins className="text-yellow-500" />} 
        isLoading={isLoading}
        unit="₺"
      />
      <RateCard 
        title="Gram Gümüş" 
        value={rates?.gramSilver} 
        icon={<TrendingUp className="text-gray-400 dark:text-gray-300" />} 
        isLoading={isLoading}
        unit="₺"
      />
      <RateCard 
        title="Dolar" 
        value={rates?.usdTry} 
        icon={<DollarSign className="text-green-500" />} 
        isLoading={isLoading}
        unit="₺"
      />
      <RateCard 
        title="Euro" 
        value={rates?.euroTry} 
        icon={<Euro className="text-blue-500" />} 
        isLoading={isLoading}
        unit="₺"
      />
    </div>
  );
};

const RateCard = ({ title, value, icon, isLoading, unit }: { title: string, value?: number, icon: React.ReactNode, isLoading: boolean, unit: string }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {isLoading ? (
          <span className="inline-block w-16 h-6 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"></span>
        ) : (
          value ? `${value.toFixed(2)} ${unit}` : '---'
        )}
      </p>
    </div>
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
      {icon}
    </div>
  </div>
);
