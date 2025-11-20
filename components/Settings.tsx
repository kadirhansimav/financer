
import React from 'react';
import { AppState } from '../types';
import { Download, Trash2, Database, FileText } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

interface SettingsProps {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
}

export const Settings: React.FC<SettingsProps> = ({ data, setData }) => {
  
  // Helper function to convert Array of Objects to CSV string
  const convertToCSV = (objArray: any[]) => {
    if (!objArray || objArray.length === 0) return '';
    
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    const headers = Object.keys(array[0]);
    
    // CSV Header
    let str = headers.join(',') + '\r\n';

    // CSV Rows
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let index in array[i]) {
        if (line !== '') line += ',';

        // Handle strings with commas or quotes
        let value = array[i][index];
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        line += value;
      }
      str += line + '\r\n';
    }
    return str;
  };

  // Helper to trigger download
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    if (!content) {
      alert('İndirilecek veri bulunamadı.');
      return;
    }
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportAssets = () => {
    const csv = convertToCSV(data.assets);
    downloadFile(csv, 'varliklarim.csv', 'text/csv');
  };

  const handleExportExpenses = () => {
    // Combine different expense types into a unified structure for export, or export active list
    const allExpenses = [
        ...data.expenses.map(e => ({...e, Type: 'One-Time'})),
        ...data.recurringExpenses.map(e => ({...e, Type: 'Recurring'})),
        ...data.installments.map(e => ({...e, Type: 'Installment'}))
    ];
    const csv = convertToCSV(allExpenses);
    downloadFile(csv, 'harcamalarim.csv', 'text/csv');
  };

  const handleExportIncomes = () => {
    const allIncomes = [
        ...data.incomes.map(i => ({...i, Type: 'Recurring'})),
        ...(data.oneTimeIncomes || []).map(i => ({...i, Type: 'One-Time'}))
    ];
    const csv = convertToCSV(allIncomes);
    downloadFile(csv, 'gelirlerim.csv', 'text/csv');
  };

  const handleResetData = async () => {
    if (window.confirm("TÜM verileriniz silinecek ve uygulama sıfırlanacak. Bu işlem geri alınamaz. Emin misiniz?")) {
        try {
          // Delete from Firestore if user is logged in
          if (auth.currentUser) {
             await deleteDoc(doc(db, "users", auth.currentUser.uid));
          }
          localStorage.removeItem('finance_app_data');
          window.location.reload();
        } catch (error) {
          console.error("Sıfırlama hatası:", error);
          alert("Veriler sıfırlanırken bir hata oluştu.");
        }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Data Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veri Yedekleme (Dışa Aktar)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verilerinizi CSV formatında indirin ve Excel gibi uygulamalarda kullanın.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleExportAssets}
            className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full group-hover:scale-110 transition-transform">
                <FileText size={24} />
            </div>
            <div className="text-center">
                <span className="block font-medium text-gray-900 dark:text-white">Varlıkları İndir</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">(.csv)</span>
            </div>
          </button>

          <button 
            onClick={handleExportExpenses}
            className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="p-3 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 rounded-full group-hover:scale-110 transition-transform">
                <FileText size={24} />
            </div>
            <div className="text-center">
                <span className="block font-medium text-gray-900 dark:text-white">Harcamaları İndir</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">(.csv)</span>
            </div>
          </button>

          <button 
            onClick={handleExportIncomes}
            className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 rounded-full group-hover:scale-110 transition-transform">
                <FileText size={24} />
            </div>
            <div className="text-center">
                <span className="block font-medium text-gray-900 dark:text-white">Gelirleri İndir</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">(.csv)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden transition-colors">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Tehlikeli Bölge</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Uygulamadaki tüm verileri kalıcı olarak silmek için bu alanı kullanın. Bu işlem geri alınamaz.
          </p>
          
          <button 
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={18} />
            Tüm Verileri Sıfırla
          </button>
        </div>
      </div>

    </div>
  );
};