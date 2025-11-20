
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AppState, MarketData, Income, Asset } from '../types';
import { calculatePortfolioValue } from '../services/calcService';
import { Calendar, TrendingDown, TrendingUp, Wallet, Bell, CheckCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  marketRates: MarketData | null;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ data, setData, marketRates }) => {
  const portfolioValue = useMemo(() => 
    calculatePortfolioValue(data.assets, marketRates), 
  [data.assets, marketRates]);

  const monthlyRecurringTotal = useMemo(() => 
    data.recurringExpenses.reduce((sum, item) => sum + item.amount, 0),
  [data.recurringExpenses]);

  const installmentMonthlyTotal = useMemo(() => 
    data.installments.reduce((sum, item) => {
       return sum + (item.totalAmount / item.installmentCount);
    }, 0),
  [data.installments]);

  // Calculate one-time expenses for the current month
  const currentMonthOneTimeExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return data.expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    }).reduce((sum, exp) => sum + exp.amount, 0);
  }, [data.expenses]);
  
  // Calculate One-Time Income for the current month
  const currentMonthOneTimeIncomes = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (data.oneTimeIncomes || []).filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
    }).reduce((sum, inc) => sum + inc.amount, 0);
  }, [data.oneTimeIncomes]);

  const totalRecurringIncome = useMemo(() => 
    data.incomes?.reduce((sum, item) => sum + item.amount, 0) || 0,
  [data.incomes]);

  const totalMonthlyIncome = totalRecurringIncome + currentMonthOneTimeIncomes;
  const totalMonthlyExpense = monthlyRecurringTotal + installmentMonthlyTotal + currentMonthOneTimeExpenses;

  // Income Check Logic
  const pendingIncomes = useMemo(() => {
    if (!data.incomes) return [];
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    return data.incomes.filter(income => {
      // Check if the scheduled day has arrived or passed
      const isDue = currentDay >= income.dayOfMonth;
      
      // Check if already deposited this month/year
      let alreadyDeposited = false;
      if (income.lastDepositedDate) {
        const lastDate = new Date(income.lastDepositedDate);
        if (lastDate.getMonth() === currentMonth && lastDate.getFullYear() === currentYear) {
          alreadyDeposited = true;
        }
      }
      
      return isDue && !alreadyDeposited;
    });
  }, [data.incomes]);

  const handleConfirmIncome = (income: Income) => {
    // 1. Create or Update Asset
    const today = new Date().toISOString();
    
    setData(prev => {
      // Update Income Record
      const updatedIncomes = prev.incomes.map(i => 
        i.id === income.id ? { ...i, lastDepositedDate: today } : i
      );

      // Add to Assets (Find 'TRY' or create one)
      let updatedAssets = [...prev.assets];
      const cashAssetIndex = updatedAssets.findIndex(a => a.type === 'TRY');

      if (cashAssetIndex >= 0) {
        updatedAssets[cashAssetIndex] = {
          ...updatedAssets[cashAssetIndex],
          amount: updatedAssets[cashAssetIndex].amount + income.amount
        };
      } else {
        const newAsset: Asset = {
          id: crypto.randomUUID(),
          type: 'TRY',
          name: 'Nakit (TL)',
          amount: income.amount,
          buyPrice: 1, // TL is always 1 TL relative to itself
          buyDate: today
        };
        updatedAssets.push(newAsset);
      }

      return {
        ...prev,
        incomes: updatedIncomes,
        assets: updatedAssets
      };
    });
  };

  const chartData = [
    { name: 'Varlıklar', value: portfolioValue },
    { name: 'Sabit Giderler (Aylık)', value: monthlyRecurringTotal },
    { name: 'Taksitler (Aylık)', value: installmentMonthlyTotal },
    { name: 'Anlık Harcamalar (Bu Ay)', value: currentMonthOneTimeExpenses },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Pending Income Alert Area */}
      {pendingIncomes.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full text-green-700 dark:text-green-400">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-100">Gelir Kontrolü</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Hesabınıza geçmesi beklenen ödemeler var.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingIncomes.map(income => (
              <div key={income.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-green-900/30 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-gray-900 dark:text-white">{income.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Beklenen: {income.dayOfMonth}. Gün</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">₺{income.amount.toLocaleString('tr-TR')}</span>
                  <button 
                    onClick={() => handleConfirmIncome(income)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Hesaba Geçti
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard 
          title="Toplam Varlık" 
          amount={portfolioValue} 
          icon={<Wallet className="text-indigo-600 dark:text-indigo-400" />}
          trend="Piyasa Değeri"
        />
        <SummaryCard 
          title="Aylık Toplam Gelir" 
          amount={totalMonthlyIncome} 
          icon={<TrendingUp className="text-green-600 dark:text-green-400" />}
          trend={currentMonthOneTimeIncomes > 0 ? "Düzenli + Anlık" : "Maaş vb."}
        />
        <SummaryCard 
          title="Bu Ayki Giderler" 
          amount={totalMonthlyExpense} 
          icon={<TrendingDown className="text-red-500 dark:text-red-400" />}
          trend="Sabit + Taksit + Harcama"
          isExpense
        />
        <SummaryCard 
          title="Net Durum (Tahmini)" 
          amount={totalMonthlyIncome - totalMonthlyExpense} 
          icon={<ArrowRight className={totalMonthlyIncome - totalMonthlyExpense >= 0 ? "text-blue-500 dark:text-blue-400" : "text-orange-500 dark:text-orange-400"} />}
          trend="Ay sonu kalan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Finansal Dağılım (Bu Ay)</h3>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`} 
                    contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Yaklaşan Ödemeler</h3>
          <div className="space-y-4">
            {data.installments.slice(0, 3).map(inst => (
              <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                    {inst.installmentCount}x
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{inst.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bitiş: {new Date(new Date(inst.startDate).setMonth(new Date(inst.startDate).getMonth() + inst.installmentCount)).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₺{(inst.totalAmount / inst.installmentCount).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
            {data.recurringExpenses.slice(0, 3).map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{rec.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Her ayın {rec.dayOfMonth}. günü</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₺{rec.amount.toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
            {data.installments.length === 0 && data.recurringExpenses.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Planlanmış ödeme bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, amount, icon, trend, isExpense = false, isCount = false }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
        {icon}
      </div>
      <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
        {trend}
      </span>
    </div>
    <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h4>
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
      {isCount ? amount : `₺${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
    </h2>
  </div>
);
