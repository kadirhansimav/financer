
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error on type
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // FIREBASE LOGIN
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin();
      } else {
        // FIREBASE SIGN UP
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      let message = "Bir hata oluştu.";
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          message = "Bu e-posta adresi zaten kayıtlı. Lütfen 'Giriş Yap' sekmesine geçiniz.";
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = "E-posta adresi veya şifre hatalı. Lütfen kontrol edin.";
          break;
        case 'auth/weak-password':
          message = "Şifreniz çok zayıf. En az 6 karakterden oluşmalıdır.";
          break;
        case 'auth/invalid-email':
          message = "Lütfen geçerli bir e-posta adresi giriniz.";
          break;
        case 'auth/network-request-failed':
          message = "İnternet bağlantınızı kontrol edin.";
          break;
        case 'auth/invalid-api-key':
          message = "Sistem yapılandırma hatası (API Key).";
          break;
        default:
          message = `Giriş yapılamadı: ${err.message}`;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
        {/* Header Area */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-90 z-0"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute top-10 -left-10 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 shadow-inner border border-white/30">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Cebimdeki Finans</h2>
            <p className="text-indigo-100 text-sm">Verileriniz güvende ve her yerde.</p>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <div className="flex gap-4 mb-8 border-b border-gray-100 dark:border-gray-700 pb-1">
            <button 
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
              onClick={() => { setIsLogin(true); setError(null); }}
            >
              Giriş Yap
            </button>
            <button 
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${!isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
              onClick={() => { setIsLogin(false); setError(null); }}
            >
              Kayıt Ol
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="ornek@mail.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten üye misiniz?'}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {isLogin ? 'Hemen kayıt olun' : 'Giriş yapın'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
