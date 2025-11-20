
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Settings as SettingsIcon, 
  Plus,
  RefreshCcw,
  Sparkles,
  Banknote,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  Cloud,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AssetManager } from './components/AssetManager';
import { ExpenseManager } from './components/ExpenseManager';
import { IncomeManager } from './components/IncomeManager';
import { MarketRates } from './components/MarketRates';
import { GeminiInsight } from './components/GeminiInsight';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { getMarketRates } from './services/geminiService';
import { AppState, MarketData, TabType } from './types';

// Firebase Imports
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const INITIAL_STATE: AppState = {
  assets: [],
  expenses: [],
  recurringExpenses: [],
  installments: [],
  incomes: [],
  oneTimeIncomes: [],
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Data state
  const [data, setData] = useState<AppState>(INITIAL_STATE);
  // Ref to track if data change is from user action (to avoid loop with db updates)
  const isInitialLoad = useRef(true);
  
  const [marketRates, setMarketRates] = useState<MarketData | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 1. Auth Listener & Data Fetching
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setPermissionError(false); // Reset error on auth change
      
      if (currentUser) {
        // Subscribe to Firestore Document
        const docRef = doc(db, "users", currentUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            // Data exists in DB
            const fetchedData = docSnap.data() as AppState;
            // Ensure all fields exist (migration handling)
            setData({ ...INITIAL_STATE, ...fetchedData });
          } else {
            // No data yet (New User), create default
            setDoc(docRef, INITIAL_STATE).catch((err) => {
               if (err.code === 'permission-denied') setPermissionError(true);
            });
            setData(INITIAL_STATE);
          }
          isInitialLoad.current = false;
        }, (error) => {
          console.error("Veri çekme hatası:", error);
          if (error.code === 'permission-denied') {
            setPermissionError(true);
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        setData(INITIAL_STATE);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Data Saving (Debounced or Effect-based)
  // Simple approach: Whenever 'data' changes, save to Firestore
  useEffect(() => {
    if (user && !isInitialLoad.current) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          const docRef = doc(db, "users", user.uid);
          await setDoc(docRef, data, { merge: true });
        } catch (err: any) {
          console.error("Kaydetme hatası:", err);
          if (err.code === 'permission-denied') {
            setPermissionError(true);
          }
        } finally {
          setIsSaving(false);
        }
      };

      // Debounce slightly to prevent too many writes during rapid inputs
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, user]);

  // Apply Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const refreshRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const rates = await getMarketRates();
      if (rates) {
        setMarketRates(rates);
      }
    } catch (error) {
      console.error("Failed to fetch rates", error);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  // Initial fetch only if authenticated
  useEffect(() => {
    if (user) {
      refreshRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogin = () => {
    refreshRates();
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} setData={setData} marketRates={marketRates} />;
      case 'assets':
        return <AssetManager data={data} setData={setData} marketRates={marketRates} />;
      case 'expenses':
        return <ExpenseManager data={data} setData={setData} />;
      case 'incomes':
        return <IncomeManager data={data} setData={setData} />;
      case 'reports':
        return <Reports data={data} marketRates={marketRates} />;
      case 'insights':
        return <GeminiInsight data={data} marketRates={marketRates} />;
      case 'settings':
        return <Settings data={data} setData={setData} />;
      default:
        return <Dashboard data={data} setData={setData} marketRates={marketRates} />;
    }
  };

  // Error Screen for Permissions
  if (permissionError) {
    return <PermissionErrorScreen />;
  }

  // If not authenticated, show Auth Screen
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar (Mobile Bottom Bar) */}
      <nav className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-full md:w-64 flex-shrink-0 md:h-screen sticky bottom-0 md:top-0 z-10 flex md:flex-col justify-between p-4 shadow-lg md:shadow-none order-2 md:order-1 transition-colors duration-200">
        <div className="flex md:flex-col w-full gap-1 md:gap-2">
          <div className="hidden md:flex items-center gap-3 px-2 mb-6 text-indigo-600 dark:text-indigo-400">
            <Wallet className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Cebimdeki Finans</h1>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Cloud size={10} className={isSaving ? "text-orange-500 animate-pulse" : "text-green-500"} />
                {isSaving ? 'Kaydediliyor...' : 'Bulut Senkronize'}
              </div>
            </div>
          </div>

          {/* Scrollable Area for Mobile */}
          <div className="flex md:flex-col w-full gap-1 md:gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={20} />} 
              label="Özet" 
            />
            <NavButton 
              active={activeTab === 'assets'} 
              onClick={() => setActiveTab('assets')} 
              icon={<TrendingUp size={20} />} 
              label="Varlıklar" 
            />
            <NavButton 
              active={activeTab === 'incomes'} 
              onClick={() => setActiveTab('incomes')} 
              icon={<Banknote size={20} />} 
              label="Gelirler" 
            />
            <NavButton 
              active={activeTab === 'expenses'} 
              onClick={() => setActiveTab('expenses')} 
              icon={<CreditCard size={20} />} 
              label="Harcamalar" 
            />
            <NavButton 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
              icon={<BarChart3 size={20} />} 
              label="Raporlar" 
            />
            <NavButton 
              active={activeTab === 'insights'} 
              onClick={() => setActiveTab('insights')} 
              icon={<Sparkles size={20} />} 
              label="Analiz" 
            />
            <NavButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<SettingsIcon size={20} />} 
              label="Ayarlar" 
            />
          </div>
        </div>
        
        {/* Footer Actions (Desktop Sidebar Bottom) */}
        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="px-2 py-1 mb-2 text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
          >
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             <span>{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto order-1 md:order-2 h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">
              {activeTab === 'dashboard' && 'Finansal Özet'}
              {activeTab === 'assets' && 'Varlıklarım'}
              {activeTab === 'expenses' && 'Harcama Yönetimi'}
              {activeTab === 'incomes' && 'Gelir Yönetimi'}
              {activeTab === 'reports' && 'Detaylı Raporlar'}
              {activeTab === 'insights' && 'Yapay Zeka Analizi'}
              {activeTab === 'settings' && 'Uygulama Ayarları'}
            </h2>
            <div className="md:hidden flex items-center gap-1 text-[10px] text-gray-500 mt-1">
               <Cloud size={10} className={isSaving ? "text-orange-500 animate-pulse" : "text-green-500"} />
               {isSaving ? 'Kaydediliyor...' : 'Bulut Senkronize'}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
               <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <LogOut size={20} />
              </button>
            </div>

            <button 
              onClick={refreshRates}
              disabled={isLoadingRates}
              className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isLoadingRates ? 'opacity-70' : ''}`}
            >
              <RefreshCcw size={16} className={isLoadingRates ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Kurları Yenile</span>
            </button>
          </div>
        </header>

        <MarketRates rates={marketRates} isLoading={isLoadingRates} />
        
        <div className="mt-6 pb-20 md:pb-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all min-w-[70px] md:w-full text-xs md:text-sm font-medium whitespace-nowrap justify-center md:justify-start flex-shrink-0
        ${active 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Component to display when Firestore permissions are missing
function PermissionErrorScreen() {
  const [copied, setCopied] = useState(false);

  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Veritabanı İzni Gerekli</h2>
            <p className="text-gray-500 dark:text-gray-400">Firebase Güvenlik Kuralları veri erişimini engelliyor.</p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            Uygulamanın çalışabilmesi için Firebase Konsolu üzerinden <strong>Firestore Database &gt; Rules</strong> sekmesine aşağıdaki kuralları yapıştırmanız gerekmektedir:
          </p>

          <div className="relative">
            <div className="absolute top-2 right-2">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm font-mono overflow-x-auto">
              {rules}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
            <strong>Neden bu hatayı alıyorum?</strong><br/>
            Firebase veritabanları varsayılan olarak "kilitli" (erişime kapalı) modda oluşturulur. Bu kurallar, sadece giriş yapmış kullanıcının kendi verisini okuyup yazabilmesini sağlar.
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Kuralları Güncelledim, Tekrar Dene
          </button>
        </div>
      </div>
    </div>
  );
}
