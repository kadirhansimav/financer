
import React, { useState, useMemo } from 'react';
import { AppState, Asset, MarketData, ASSET_TYPES } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, PieChart, RefreshCw } from 'lucide-react';
import { calculateProfitLoss } from '../services/calcService';

interface AssetManagerProps {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  marketRates: MarketData | null;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ data, setData, marketRates }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ 
    type: 'GOLD',
    buyDate: new Date().toISOString().split('T')[0]
  });

  // Calculate summary grouped by asset type
  const assetSummary = useMemo(() => {
    const summary: Record<string, { amount: number, value: number, cost: number }> = {};
    
    data.assets.forEach(asset => {
      const { currentValue } = calculateProfitLoss(asset, marketRates);
      const cost = asset.amount * asset.buyPrice;
      
      if (!summary[asset.type]) {
        summary[asset.type] = { amount: 0, value: 0, cost: 0 };
      }
      summary[asset.type].amount += asset.amount;
      summary[asset.type].value += currentValue;
      summary[asset.type].cost += cost;
    });

    return Object.entries(summary).map(([type, stats]) => ({
      type: type as keyof typeof ASSET_TYPES,
      ...stats,
      profit: stats.value - stats.cost,
      profitPercent: stats.cost > 0 ? ((stats.value - stats.cost) / stats.cost) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [data.assets, marketRates]);

  const getRateForType = (type: string): number | null => {
    if (!marketRates) return null;
    switch (type) {
      case 'GOLD': return marketRates.gramGold;
      case 'SILVER': return marketRates.gramSilver;
      case 'USD': return marketRates.usdTry;
      case 'EURO': return marketRates.euroTry || 0;
      case 'TRY': return 1;
      default: return null;
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as Asset['type'];
    const rate = getRateForType(type);
    
    setNewAsset(prev => ({
      ...prev,
      type,
      // Auto-fill price if rate exists, otherwise keep existing or 0
      buyPrice: rate || (type === 'TRY' ? 1 : 0)
    }));
  };

  const handleUseCurrentRate = () => {
    if (!newAsset.type) return;
    const rate = getRateForType(newAsset.type);
    if (rate) {
      setNewAsset(prev => ({ ...prev, buyPrice: rate }));
    }
  };

  const handleAdd = () => {
    if (!newAsset.name || !newAsset.amount || !newAsset.buyPrice) return;
    
    const asset: Asset = {
      id: crypto.randomUUID(),
      type: newAsset.type as any,
      name: newAsset.name,
      amount: Number(newAsset.amount),
      buyPrice: Number(newAsset.buyPrice),
      buyDate: newAsset.buyDate || new Date().toISOString()
    };

    setData(prev => ({ ...prev, assets: [...prev.assets, asset] }));
    setIsAdding(false);
    setNewAsset({ 
      type: 'GOLD',
      buyDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = (id: string) => {
    setData(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }));
  };

  const currentRate = newAsset.type ? getRateForType(newAsset.type) : null;

  return (
    <div className="space-y-6">
      
      {/* Asset Summary Section */}
      {assetSummary.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Varlık Özeti</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assetSummary.map((item) => (
              <div key={item.type} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{ASSET_TYPES[item.type]}</span>
                  {item.profit !== 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.profit >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      %{item.profitPercent.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                   ₺{item.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Toplam: {item.amount.toLocaleString('tr-TR')} {item.type === 'TRY' || item.type === 'USD' || item.type === 'EURO' ? 'Birim' : (item.type === 'STOCK' ? 'Lot' : 'Gr')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Varlık Portföyü</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Varlık Ekle
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
          <h4 className="font-medium mb-4 text-gray-900 dark:text-white">Yeni Varlık Ekle</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Varlık Türü</label>
              <select 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAsset.type}
                onChange={handleTypeChange}
              >
                {Object.entries(ASSET_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Açıklama</label>
              <input 
                type="text" 
                placeholder="Örn: Çeyrek Altın" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAsset.name || ''}
                onChange={e => setNewAsset({...newAsset, name: e.target.value})}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Miktar</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAsset.amount || ''}
                onChange={e => setNewAsset({...newAsset, amount: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Alış Birim Fiyatı (TL)</label>
                {currentRate && (
                  <button 
                    onClick={handleUseCurrentRate}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Güncel kuru kullan"
                  >
                    <RefreshCw size={8} />
                    Kur: {currentRate.toFixed(2)}
                  </button>
                )}
              </div>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAsset.buyPrice || ''}
                onChange={e => setNewAsset({...newAsset, buyPrice: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Alış Tarihi</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAsset.buyDate}
                onChange={e => setNewAsset({...newAsset, buyDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="p-4 font-medium">Tür</th>
                <th className="p-4 font-medium">Açıklama</th>
                <th className="p-4 font-medium">Alış Tarihi</th>
                <th className="p-4 font-medium">Miktar</th>
                <th className="p-4 font-medium">Alış Fiyatı</th>
                <th className="p-4 font-medium">Güncel Değer</th>
                <th className="p-4 font-medium">Kar / Zarar</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.assets.map(asset => {
                const pl = calculateProfitLoss(asset, marketRates);
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in">
                    <td className="p-4">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                        {ASSET_TYPES[asset.type]}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{asset.name}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(asset.buyDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{asset.amount}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">₺{asset.buyPrice.toLocaleString('tr-TR')}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      {pl.currentValue > 0 
                        ? `₺${pl.currentValue.toLocaleString('tr-TR')}` 
                        : <span className="text-gray-400">Hesaplanamıyor</span>}
                    </td>
                    <td className="p-4">
                      {pl.currentValue > 0 ? (
                        <div className={`flex items-center gap-1 ${pl.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {pl.profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          <span className="font-bold">
                            {pl.percentage.toFixed(2)}%
                          </span>
                          <span className="text-xs opacity-75">
                            (₺{Math.abs(pl.profit).toLocaleString('tr-TR')})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.assets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 dark:text-gray-500">
                    Henüz bir varlık eklenmemiş.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
