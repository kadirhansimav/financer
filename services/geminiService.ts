import { GoogleGenAI } from "@google/genai";
import { AppState, MarketData, ASSET_TYPES } from '../types';
import { calculateProfitLoss } from './calcService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketRates = async (): Promise<MarketData | null> => {
  try {
    // We use Search Grounding to find the latest rates
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Şu anki Serbest Piyasa Gram Altın, Gram Gümüş, Dolar/TL ve Euro/TL fiyatları nedir? Lütfen net rakamları bul.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "";
    // console.log("Raw Search Result:", text);

    // Since we cannot ask for JSON with Search Grounding reliably, 
    // we make a second fast call to structure the data found in the text.
    // This is a robust pattern: Search (Content) -> Flash (Structure)
    
    const extractionResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      Aşağıdaki metinden finansal verileri çıkar ve JSON formatında ver.
      Metin: "${text}"
      
      İstenen Format:
      {
        "gramGold": <sayısal değer>,
        "gramSilver": <sayısal değer>,
        "usdTry": <sayısal değer>,
        "euroTry": <sayısal değer>
      }
      Sadece JSON döndür.
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = extractionResponse.text;
    if (!jsonText) return null;
    
    const data = JSON.parse(jsonText);
    
    return {
      gramGold: data.gramGold || 0,
      gramSilver: data.gramSilver || 0,
      usdTry: data.usdTry || 0,
      euroTry: data.euroTry || 0,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const analyzeFinances = async (data: AppState, rates: MarketData | null): Promise<string> => {
  // 1. Prepare detailed asset context with Profit/Loss info
  const assetDetails = data.assets.map(asset => {
    const pl = calculateProfitLoss(asset, rates);
    return `
    - Varlık: ${asset.name} (${ASSET_TYPES[asset.type]})
      Miktar: ${asset.amount}
      Alış Maliyeti: ${asset.buyPrice} TL
      Şu Anki Değer: ${pl.currentValue.toFixed(2)} TL
      Kar/Zarar Durumu: %${pl.percentage.toFixed(2)} (${pl.profit > 0 ? 'KAR' : 'ZARAR'})
    `;
  }).join('\n');

  // 2. Prepare Summary Context
  const distinctTypes = [...new Set(data.assets.map(a => ASSET_TYPES[a.type]))].join(', ');
  const totalDebt = data.installments.reduce((sum, i) => sum + (i.totalAmount - (i.paidInstallments || 0) * (i.totalAmount/i.installmentCount)), 0);
  const monthlyIncome = data.incomes.reduce((sum, i) => sum + i.amount, 0);
  
  // 3. Construct the Prompt
  const prompt = `
    Sen uzman bir yatırım danışmanısın. Görevin, kullanıcının portföyünü güncel piyasa haberleri ve trendleri ile karşılaştırarak analiz etmek.
    
    KULLANICI PORTFÖY DETAYLARI:
    ${assetDetails || "Henüz varlık eklenmemiş."}

    FİNANSAL ÖZET:
    - Portföydeki Varlık Türleri: ${distinctTypes}
    - Toplam Kalan Taksit Borcu: ~${totalDebt} TL
    - Aylık Düzenli Gelir: ${monthlyIncome} TL

    GÖREVLERİN:
    1. Google Search aracını kullanarak kullanıcının elindeki varlık türleri (Örn: Altın, Dolar, Gümüş, Borsa vb.) için SON DAKİKA piyasa analizlerini, uzman yorumlarını ve gelecek trendlerini araştır.
    2. Kullanıcının "Alış Maliyeti" ile "Güncel Piyasa" durumunu kıyasla. (Örn: "Altını düşükten almışsınız, trend yükselişte, tutmaya devam edin" veya "Zarardasınız ama piyasa toparlanabilir").
    3. Gelir/Borç dengesini gözeterek risk uyarısı yap.
    4. Yanıtı Markdown formatında, başlıklar ve maddeler halinde ver.
    5. En sona mutlaka "Yatırım Tavsiyesi Değildir (YTD)" uyarısı ekle.

    ÖNEMLİ: Yanıtın kişisel olmalı. Genel geçer bilgiler yerine kullanıcının alış fiyatlarına atıfta bulunarak konuş.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable search specifically for this request
      },
    });
    
    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Hata: Analiz servisine ulaşılamadı veya internet bağlantısı kısıtlı.";
  }
};