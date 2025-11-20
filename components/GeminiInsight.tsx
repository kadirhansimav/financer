import React, { useState } from 'react';
import { AppState, MarketData } from '../types';
import { analyzeFinances } from '../services/geminiService';
import { Sparkles, MessageSquare, Search, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GeminiInsightProps {
  data: AppState;
  marketRates: MarketData | null;
}

export const GeminiInsight: React.FC<GeminiInsightProps> = ({ data, marketRates }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeFinances(data, marketRates);
      setAnalysis(result);
    } catch (err) {
      setAnalysis("Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 animate-pulse">
          <Sparkles size={150} />
        </div>
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <Sparkles className="text-yellow-300" /> 
          Gemini Akıllı Portföy Analizi
        </h3>
        <p className="text-indigo-100 mb-6 max-w-2xl text-lg leading-relaxed">
          Yapay zeka, portföyünüzdeki varlıkları (Altın, Döviz vb.) alış maliyetlerinizle birlikte inceler. 
          Google Search üzerinden <strong>güncel piyasa haberlerini ve trendleri</strong> tarayarak size özel, nokta atışı stratejiler sunar.
        </p>
        
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all flex items-center gap-3 disabled:opacity-80 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Piyasa Taranıyor...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              Piyasayı Tara ve Portföyümü Yorumla
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center animate-pulse border border-gray-100 dark:border-gray-700">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gemini Piyasaları İnceliyor...</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Varlıklarınızın güncel trendlere göre performansını hesaplıyoruz.</p>
        </div>
      )}

      {analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 animate-fade-in transition-colors">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Kişisel Finans Raporu</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gemini 2.5 Flash & Google Search Data</p>
            </div>
          </div>
          
          <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
             <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-start gap-3">
            <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Yasal Uyarı:</strong> Bu analiz yapay zeka tarafından genel piyasa verileri ve trendler baz alınarak oluşturulmuştur. Kesin yatırım tavsiyesi içermez. Yatırım kararlarınızı vermeden önce lütfen lisanslı bir yatırım danışmanına başvurun.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};