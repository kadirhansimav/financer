
import React, { useState, useMemo } from 'react';
import { AppState, InstallmentPlan, RecurringExpense, Expense } from '../types';
import { Plus, Trash2, Clock, CreditCard, Tag, ShoppingBag, PieChart as PieIcon, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseManagerProps {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
}

const CATEGORIES = [
  { value: 'Gıda', label: 'Gıda & Market' },
  { value: 'Konut', label: 'Konut & Kira' },
  { value: 'Ulaşım', label: 'Ulaşım' },
  { value: 'Faturalar', label: 'Faturalar' },
  { value: 'Alışveriş', label: 'Giyim & Alışveriş' },
  { value: 'Eğlence', label: 'Eğlence' },
  { value: 'Sağlık', label: 'Sağlık' },
  { value: 'Eğitim', label: 'Eğitim' },
  { value: 'Teknoloji', label: 'Teknoloji' },
  { value: 'Diğer', label: 'Diğer' }
];

// Specific colors for each category to make the chart more intuitive
const CATEGORY_COLORS: Record<string, string> = {
  'Gıda': '#f59e0b',      // Amber/Orange
  'Konut': '#3b82f6',     // Blue
  'Ulaşım': '#06b6d4',    // Cyan
  'Faturalar': '#ef4444', // Red
  'Alışveriş': '#ec4899', // Pink
  'Eğlence': '#8b5cf6',   // Violet
  'Sağlık': '#10b981',    // Emerald
  'Eğitim': '#6366f1',    // Indigo
  'Teknoloji': '#64748b', // Slate
  'Diğer': '#9ca3af'      // Gray
};

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ data, setData }) => {
  const [tab, setTab] = useState<'expense' | 'installment' | 'recurring'>('expense');
  const [isAdding, setIsAdding] = useState(false);
  
  // Chart Filter State
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Simplified generic state for forms
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [count, setCount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Diğer');

  // --- Chart Calculation Logic ---
  const categoryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const map: Record<string, number> = {};

    // Weekly range setup
    const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMon = now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diffToMon);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    // Helper: Check if a specific day of month falls within the current week
    const isDayInCurrentWeek = (dayOfMonth: number) => {
      const temp = new Date(weekStart);
      for(let i=0; i<7; i++) {
        if (temp.getDate() === dayOfMonth) return true;
        temp.setDate(temp.getDate() + 1);
      }
      return false;
    };

    const addToMap = (cat: string, val: number) => {
       const key = cat || 'Diğer';
       map[key] = (map[key] || 0) + val;
    };

    // 1. One-time Expenses
    data.expenses.forEach(exp => {
      const d = new Date(exp.date);
      
      if (chartPeriod === 'yearly') {
        if (d.getFullYear() === currentYear) addToMap(exp.category, exp.amount);
      } else if (chartPeriod === 'monthly') {
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          addToMap(exp.category, exp.amount);
        }
      } else if (chartPeriod === 'weekly') {
        if (d >= weekStart && d <= weekEnd) {
          addToMap(exp.category, exp.amount);
        }
      }
    });

    // 2. Recurring Expenses
    data.recurringExpenses.forEach(rec => {
      if (chartPeriod === 'yearly') {
        addToMap(rec.category, rec.amount * 12);
      } else if (chartPeriod === 'monthly') {
        addToMap(rec.category, rec.amount);
      } else if (chartPeriod === 'weekly') {
        // Only add if the payment day falls within this week
        if (isDayInCurrentWeek(rec.dayOfMonth)) {
          addToMap(rec.category, rec.amount);
        }
      }
    });

    // 3. Installments
    data.installments.forEach(inst => {
      const monthlyAmount = inst.totalAmount / inst.installmentCount;
      const startDate = new Date(inst.startDate);
      const startDay = startDate.getDate();
      
      if (chartPeriod === 'yearly') {
         let monthsToCount = 0;
         for(let i = 0; i < 12; i++) {
            const currentCheckIndex = currentYear * 12 + i;
            const startMonthIndex = startDate.getFullYear() * 12 + startDate.getMonth();
            
            if (currentCheckIndex >= startMonthIndex && currentCheckIndex < startMonthIndex + inst.installmentCount) {
              monthsToCount++;
            }
         }
         if (monthsToCount > 0) addToMap(inst.category, monthlyAmount * monthsToCount);

      } else if (chartPeriod === 'monthly') {
         const monthDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
         if (monthDiff >= 0 && monthDiff < inst.installmentCount) {
           addToMap(inst.category, monthlyAmount);
         }

      } else if (chartPeriod === 'weekly') {
        // Check if active this month AND payment day is in this week
        const monthDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
        const isActive = monthDiff >= 0 && monthDiff < inst.installmentCount;
        
        // We assume installment is paid on the same 'day' of the month as start date
        if (isActive && isDayInCurrentWeek(startDay)) {
          addToMap(inst.category, monthlyAmount);
        }
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .filter(item => item.value > 0);

  }, [data, chartPeriod]);

  const totalPeriodExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  // --- CRUD Handlers ---

  const handleAdd = () => {
    if (tab === 'installment') {
      const newItem: InstallmentPlan = {
        id: crypto.randomUUID(),
        title,
        totalAmount: Number(amount),
        installmentCount: Number(count),
        startDate: date,
        category: category
      };
      setData(prev => ({ ...prev, installments: [...prev.installments, newItem] }));
    } else if (tab === 'recurring') {
      const newItem: RecurringExpense = {
        id: crypto.randomUUID(),
        title,
        amount: Number(amount),
        dayOfMonth: Number(count), // reusing count field for day
        category: category
      };
      setData(prev => ({ ...prev, recurringExpenses: [...prev.recurringExpenses, newItem] }));
    } else {
      // Normal One-time Expense
      const newItem: Expense = {
        id: crypto.randomUUID(),
        title,
        amount: Number(amount),
        date: date,
        category: category
      };
      setData(prev => ({ ...prev, expenses: [...prev.expenses, newItem] }));
    }
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle(''); 
    setAmount(''); 
    setCount(''); 
    setDate(new Date().toISOString().split('T')[0]); 
    setCategory('Diğer');
  };

  const deleteItem = (id: string, type: 'installment' | 'recurring' | 'expense') => {
    if (type === 'installment') {
      setData(prev => ({ ...prev, installments: prev.installments.filter(i => i.id !== id) }));
    } else if (type === 'recurring') {
      setData(prev => ({ ...prev, recurringExpenses: prev.recurringExpenses.filter(i => i.id !== id) }));
    } else {
      setData(prev => ({ ...prev, expenses: prev.expenses.filter(i => i.id !== id) }));
    }
  };

  const renderContent = () => {
    if (tab === 'installment') {
      return data.installments.length === 0 ? renderEmptyState() : (
        data.installments.map(inst => {
          // Calculations for display
          const startDate = new Date(inst.startDate);
          const endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + inst.installmentCount);
          
          const now = new Date();
          const monthDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
          // We assume if we are in the start month, 1 installment is due/paid
          const paidCount = Math.min(Math.max(monthDiff + 1, 0), inst.installmentCount);
          const remainingCount = inst.installmentCount - paidCount;
          const progressPercent = (paidCount / inst.installmentCount) * 100;
          const monthlyAmount = inst.totalAmount / inst.installmentCount;

          return (
            <div key={inst.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
              <button 
                onClick={() => deleteItem(inst.id, 'installment')}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{inst.title}</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {inst.category || 'Diğer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">İlerleme</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{paidCount} / {inst.installmentCount} Taksit</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aylık Ödeme</p>
                  <p className="font-bold text-gray-900 dark:text-white">₺{monthlyAmount.toLocaleString('tr-TR')}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Toplam Tutar</p>
                   <p className="font-bold text-gray-900 dark:text-white">₺{inst.totalAmount.toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Kalan Taksit
                  </p>
                  <p className={`font-bold ${remainingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    {remainingCount > 0 ? `${remainingCount} Ay` : 'Bitti'}
                  </p>
                </div>
                <div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                     <Calendar size={12} /> Bitiş Tarihi
                   </p>
                   <p className="font-medium text-gray-700 dark:text-gray-300">
                     {endDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                   </p>
                </div>
              </div>
            </div>
          );
        })
      );
    } else if (tab === 'recurring') {
      return data.recurringExpenses.length === 0 ? renderEmptyState() : (
        data.recurringExpenses.map(rec => (
          <div key={rec.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
            <button 
              onClick={() => deleteItem(rec.id, 'recurring')}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{rec.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aylık Düzenli Ödeme</p>
              </div>
            </div>

            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                <Tag size={12} />
                {rec.category || 'Diğer'}
              </span>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
              <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                 Her ayın {rec.dayOfMonth}. günü
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">₺{rec.amount.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        ))
      );
    } else {
      // One-time Expenses List
      // Sort by date descending
      const sortedExpenses = [...data.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return sortedExpenses.length === 0 ? renderEmptyState() : (
        sortedExpenses.map(exp => (
          <div key={exp.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
             <button 
              onClick={() => deleteItem(exp.id, 'expense')}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{exp.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                <Tag size={12} />
                {exp.category || 'Diğer'}
              </span>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Tutar</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">₺{exp.amount.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        ))
      );
    }
  };

  const renderEmptyState = () => (
    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
      Kayıt bulunamadı. Yeni eklemek için yukarıdaki butonu kullanın.
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* ANALYSIS CHART SECTION */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
              Harcama Analizi
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {chartPeriod === 'weekly' && 'Bu haftaki'} 
              {chartPeriod === 'monthly' && 'Bu ayki'} 
              {chartPeriod === 'yearly' && 'Bu yılki'} 
              {' '}toplam harcama dağılımı
            </p>
          </div>
        </div>
        
        {/* PROMINENT FILTER TOGGLE */}
        <div className="bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl flex mb-6 shadow-inner">
           <button 
             onClick={() => setChartPeriod('weekly')}
             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${chartPeriod === 'weekly' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
           >
             Bu Hafta
           </button>
           <button 
             onClick={() => setChartPeriod('monthly')}
             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${chartPeriod === 'monthly' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
           >
             Bu Ay
           </button>
           <button 
             onClick={() => setChartPeriod('yearly')}
             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${chartPeriod === 'yearly' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
           >
             Bu Yıl
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="h-64 md:col-span-2">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.name] || '#9ca3af'} 
                        strokeWidth={0} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                    contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 flex-col gap-2 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                 <PieIcon size={32} className="opacity-20" />
                 <p>Bu dönem için veri yok</p>
               </div>
            )}
          </div>
          
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-center transition-colors">
            <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">
              Toplam Gider ({chartPeriod === 'weekly' ? 'Hafta' : chartPeriod === 'monthly' ? 'Ay' : 'Yıl'})
            </h4>
            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 break-all">
              ₺{totalPeriodExpense.toLocaleString('tr-TR')}
            </div>
            <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-2">
              Sabit + Taksit + Harcama
            </p>
          </div>
        </div>
      </div>

      {/* TABS & LISTS */}
      <div className="flex gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button 
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${tab === 'expense' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          onClick={() => setTab('expense')}
        >
          Anlık Harcamalar
        </button>
        <button 
          className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${tab === 'installment' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          onClick={() => setTab('installment')}
        >
          Taksitli İşlemler
        </button>
        <button 
           className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${tab === 'recurring' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
           onClick={() => setTab('recurring')}
        >
          Sabit Giderler
        </button>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          {tab === 'expense' ? 'Harcama Ekle' : (tab === 'installment' ? 'Taksit Ekle' : 'Gider Ekle')}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
          <h4 className="font-medium mb-4 text-gray-900 dark:text-white">
            {tab === 'expense' ? 'Yeni Harcama' : (tab === 'installment' ? 'Yeni Taksit Planı' : 'Yeni Sabit Gider')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Başlık</label>
              <input 
                type="text" 
                placeholder="Örn: Market, Telefon" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {tab === 'installment' ? "Toplam Tutar" : "Tutar"}
              </label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={amount} onChange={e => setAmount(e.target.value)}
              />
            </div>

            {/* Field for Count or Day */}
            {tab !== 'expense' && (
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {tab === 'installment' ? "Taksit Sayısı" : "Ödeme Günü (1-31)"}
                </label>
                <input 
                  type="number" 
                  placeholder={tab === 'installment' ? "12" : "15"}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={count} onChange={e => setCount(e.target.value)}
                />
              </div>
            )}
            
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
              <select 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Date Field - Show for Installment and Expense */}
            {(tab === 'installment' || tab === 'expense') && (
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {tab === 'installment' ? 'Başlangıç Tarihi' : 'Harcama Tarihi'}
                </label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={date} onChange={e => setDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">İptal</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Kaydet</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderContent()}
      </div>
    </div>
  );
};
