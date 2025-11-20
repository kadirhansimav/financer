
import React, { useState } from 'react';
import { AppState, Income, OneTimeIncome, Asset } from '../types';
import { Plus, Trash2, Banknote, CalendarCheck, Wallet, Calendar } from 'lucide-react';

interface IncomeManagerProps {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
}

const INCOME_CATEGORIES = [
  { value: 'Maaş', label: 'Maaş' },
  { value: 'Prim', label: 'Prim' },
  { value: 'Satış', label: 'Satış' },
  { value: 'Kira', label: 'Kira Geliri' },
  { value: 'Yatırım', label: 'Yatırım Getirisi' },
  { value: 'Hediye', label: 'Hediye' },
  { value: 'Diğer', label: 'Diğer' }
];

export const IncomeManager: React.FC<IncomeManagerProps> = ({ data, setData }) => {
  const [tab, setTab] = useState<'recurring' | 'onetime'>('recurring');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(''); // For recurring
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // For one-time
  const [category, setCategory] = useState('Diğer');

  const handleAdd = () => {
    if (!title || !amount) return;

    if (tab === 'recurring') {
      if (!day) return;
      const newIncome: Income = {
        id: crypto.randomUUID(),
        title,
        amount: Number(amount),
        dayOfMonth: Number(day)
      };
      setData(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }));
    } else {
      // One Time Income
      const newIncome: OneTimeIncome = {
        id: crypto.randomUUID(),
        title,
        amount: Number(amount),
        date: date,
        category: category
      };

      setData(prev => {
        // 1. Add to history
        const newOneTimeIncomes = [...(prev.oneTimeIncomes || []), newIncome];

        // 2. Automatically Add to 'TRY' Asset
        let updatedAssets = [...prev.assets];
        const cashIndex = updatedAssets.findIndex(a => a.type === 'TRY');
        
        if (cashIndex >= 0) {
           updatedAssets[cashIndex] = {
              ...updatedAssets[cashIndex],
              amount: updatedAssets[cashIndex].amount + Number(amount)
           };
        } else {
           updatedAssets.push({
              id: crypto.randomUUID(),
              type: 'TRY',
              name: 'Nakit (TL)',
              amount: Number(amount),
              buyPrice: 1,
              buyDate: new Date().toISOString()
           });
        }

        return { 
          ...prev, 
          oneTimeIncomes: newOneTimeIncomes,
          assets: updatedAssets
        };
      });
    }

    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDay('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Diğer');
  };

  const handleDelete = (id: string, type: 'recurring' | 'onetime') => {
    if (type === 'recurring') {
      setData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }));
    } else {
      // Note: Deleting history doesn't deduct from assets automatically to avoid negative balance confusion
      setData(prev => ({ ...prev, oneTimeIncomes: prev.oneTimeIncomes.filter(i => i.id !== id) }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button 
              className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${tab === 'recurring' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setTab('recurring')}
            >
              Düzenli Gelirler
            </button>
            <button 
              className={`pb-3 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${tab === 'onetime' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setTab('onetime')}
            >
              Anlık Gelirler
            </button>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          {tab === 'recurring' ? 'Düzenli Gelir Ekle' : 'Gelir Ekle'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
          <h4 className="font-medium mb-4 text-gray-900 dark:text-white">
             {tab === 'recurring' ? 'Yeni Düzenli Gelir' : 'Yeni Anlık Gelir'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Başlık</label>
              <input 
                type="text" 
                placeholder="Örn: Maaş, Freelance" 
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Miktar (TL)</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={amount} onChange={e => setAmount(e.target.value)}
              />
            </div>
            
            {tab === 'recurring' ? (
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yatma Günü (1-31)</label>
                <input 
                  type="number" 
                  min="1" max="31"
                  placeholder="15"
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={day} onChange={e => setDay(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tarih</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={date} onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
                  <select 
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={category} onChange={e => setCategory(e.target.value)}
                  >
                    {INCOME_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {tab === 'onetime' && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-lg flex items-center gap-2 transition-colors">
              <Wallet size={14} />
              Bu gelir eklendiğinde "Nakit (TL)" varlığınıza otomatik olarak eklenecektir.
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">İptal</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Kaydet</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tab === 'recurring' ? (
           data.incomes.length > 0 ? data.incomes.map(income => (
            <div key={income.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
              <button 
                onClick={() => handleDelete(income.id, 'recurring')}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                  <Banknote size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{income.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <CalendarCheck size={12} />
                    <span>Her ayın {income.dayOfMonth}. günü</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Aylık Tutar</span>
                <span className="font-bold text-xl text-green-600 dark:text-green-400">
                  ₺{income.amount.toLocaleString('tr-TR')}
                </span>
              </div>
              
              {income.lastDepositedDate && (
                 <div className="mt-2 text-right text-[10px] text-gray-400 dark:text-gray-500">
                   Son onay: {new Date(income.lastDepositedDate).toLocaleDateString('tr-TR')}
                 </div>
              )}
            </div>
          )) : renderEmptyState()
        ) : (
          // One Time Incomes
          (data.oneTimeIncomes && data.oneTimeIncomes.length > 0) ? 
          [...data.oneTimeIncomes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(income => (
            <div key={income.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
              <button 
                onClick={() => handleDelete(income.id, 'onetime')}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{income.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(income.date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="mb-3">
                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                   {income.category}
                 </span>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Tutar</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  ₺{income.amount.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          )) : renderEmptyState()
        )}
      </div>
    </div>
  );

  function renderEmptyState() {
    return (
      <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
        <Banknote size={48} className="mb-4 opacity-20" />
        <p>Henüz kayıt bulunamadı.</p>
        <button onClick={() => setIsAdding(true)} className="mt-2 text-green-600 dark:text-green-400 font-medium hover:underline">
          İlk geliri ekle
        </button>
      </div>
    );
  }
};
