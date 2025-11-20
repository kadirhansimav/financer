
import React, { useState, useMemo } from 'react';
import { AppState, MarketData, ASSET_TYPES } from '../types';
import { calculateProfitLoss, calculatePortfolioValue } from '../services/calcService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, Filter } from 'lucide-react';

interface ReportsProps {
  data: AppState;
  marketRates: MarketData | null;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export const Reports: React.FC<ReportsProps> = ({ data, marketRates }) => {
  const [assetFilter, setAssetFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  
  // 1. Asset Performance Logic
  const assetPerformance = useMemo(() => {
    const grouped: Record<string, { cost: number; value: number }> = {};

    // Filter Logic
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filteredAssets = data.assets.filter(asset => {
      if (assetFilter === 'all') return true;
      
      const buyDate = new Date(asset.buyDate);
      buyDate.setHours(0, 0, 0, 0);

      if (assetFilter === 'day') {
        return buyDate.getTime() === now.getTime();
      }
      if (assetFilter === 'week') {
        const currentDay = now.getDay() || 7; // Make Sunday 7
        const monday = new Date(now);
        monday.setDate(now.getDate() - currentDay + 1);
        return buyDate >= monday;
      }
      if (assetFilter === 'month') {
        return buyDate.getMonth() === now.getMonth() && buyDate.getFullYear() === now.getFullYear();
      }
      if (assetFilter === 'year') {
        return buyDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    filteredAssets.forEach(asset => {
      const pl = calculateProfitLoss(asset, marketRates);
      if (!grouped[asset.type]) {
        grouped[asset.type] = { cost: 0, value: 0 };
      }
      grouped[asset.type].cost += asset.amount * asset.buyPrice;
      grouped[asset.type].value += pl.currentValue;
    });

    return Object.entries(grouped).map(([type, stats]) => {
      const profit = stats.value - stats.cost;
      const percent = stats.cost > 0 ? (profit / stats.cost) * 100 : 0;
      return {
        type: ASSET_TYPES[type] || type,
        cost: stats.cost,
        value: stats.value,
        profit,
        percent
      };
    }).sort((a, b) => b.value - a.value);
  }, [data.assets, marketRates, assetFilter]);

  // 2. Cash Flow Logic (Last 6 Months)
  const monthlyCashFlow = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('tr-TR', { month: 'short' });
      const monthIndex = d.getMonth();
      const year = d.getFullYear();

      // Calculate Income
      const recurringIncome = data.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const oneTimeIncome = (data.oneTimeIncomes || [])
        .filter(inc => {
          const iDate = new Date(inc.date);
          return iDate.getMonth() === monthIndex && iDate.getFullYear() === year;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);

      // Calculate Expenses
      const recurringExpense = data.recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Installments: Check if plan is active in this month
      const installmentExpense = data.installments.reduce((sum, inst) => {
        const startDate = new Date(inst.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + inst.installmentCount);
        
        if (d >= startDate && d < endDate) {
          return sum + (inst.totalAmount / inst.installmentCount);
        }
        return sum;
      }, 0);

      const oneTimeExpense = data.expenses
        .filter(exp => {
          const eDate = new Date(exp.date);
          return eDate.getMonth() === monthIndex && eDate.getFullYear() === year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      months.push({
        name: monthName,
        Gelir: recurringIncome + oneTimeIncome,
        Gider: recurringExpense + installmentExpense + oneTimeExpense
      });
    }
    return months;
  }, [data]);

  // 3. Expense Category Logic
  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};

    // One-time
    data.expenses.forEach(exp => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    // Recurring (Multiply by 1 for "Monthly Weight")
    data.recurringExpenses.forEach(exp => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    // Installments (Monthly impact)
    data.installments.forEach(inst => {
      map[inst.category] = (map[inst.category] || 0) + (inst.totalAmount / inst.installmentCount);
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 4. Totals
  const totalAssets = calculatePortfolioValue(data.assets, marketRates);
  const remainingDebt = data.installments.reduce((sum, inst) => {
      // Approximate remaining debt (Total - (Monthly * MonthsPassed))
      const monthly = inst.totalAmount / inst.installmentCount;
      const startDate = new Date(inst.startDate);
      const now = new Date();
      const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      const paidMonths = Math.min(Math.max(monthsPassed, 0), inst.installmentCount);
      const remaining = inst.totalAmount - (monthly * paidMonths);
      return sum + remaining;
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Wallet size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Varlık</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{(totalAssets - remainingDebt).toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Toplam Varlık - Kalan Borçlar</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><TrendingUp size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Yatırım Karı (Toplam)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₺{assetPerformance.reduce((sum, item) => sum + item.profit, 0).toLocaleString('tr-TR')}
          </p>
           <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Anlık piyasa değerine göre</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-500 dark:text-red-400"><TrendingDown size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Kalan Taksit Borcu</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{remainingDebt.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ödenmemiş taksit tutarları</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Gelir / Gider (Son 6 Ay)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                  contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Harcama Dağılımı (Kategori)</h3>
          <div className="h-72">
             {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                    contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 flex-col gap-2">
                 <PieIcon size={32} />
                 <p>Veri yok</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Asset Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yatırım Performans Tablosu</h3>
          
          {/* Filter Controls */}
          <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
            <button 
              onClick={() => setAssetFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${assetFilter === 'all' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Tümü
            </button>
            <button 
              onClick={() => setAssetFilter('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${assetFilter === 'day' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Bugün
            </button>
            <button 
              onClick={() => setAssetFilter('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${assetFilter === 'week' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Bu Hafta
            </button>
             <button 
              onClick={() => setAssetFilter('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${assetFilter === 'month' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Bu Ay
            </button>
             <button 
              onClick={() => setAssetFilter('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${assetFilter === 'year' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Bu Yıl
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="p-4 font-medium">Varlık Türü</th>
                <th className="p-4 font-medium">Toplam Maliyet</th>
                <th className="p-4 font-medium">Şu Anki Değer</th>
                <th className="p-4 font-medium">Net Kar/Zarar (TL)</th>
                <th className="p-4 font-medium">Kar/Zarar (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {assetPerformance.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.type}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">₺{item.cost.toLocaleString('tr-TR')}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">₺{item.value.toLocaleString('tr-TR')}</td>
                  <td className={`p-4 font-bold ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.profit >= 0 ? '+' : ''}₺{item.profit.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.percent >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      %{item.percent.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {assetPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter size={24} className="opacity-30" />
                      <span>Bu dönemde alınan varlık bulunamadı.</span>
                    </div>
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
