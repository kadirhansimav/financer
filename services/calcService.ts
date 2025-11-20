import { Asset, MarketData } from '../types';

export const calculatePortfolioValue = (assets: Asset[], rates: MarketData | null): number => {
  if (!rates) return 0;
  
  return assets.reduce((total, asset) => {
    let currentValue = 0;
    switch (asset.type) {
      case 'GOLD':
        currentValue = asset.amount * rates.gramGold;
        break;
      case 'SILVER':
        currentValue = asset.amount * rates.gramSilver;
        break;
      case 'USD':
        currentValue = asset.amount * rates.usdTry;
        break;
      case 'EURO':
        currentValue = asset.amount * (rates.euroTry || 0);
        break;
      default:
        currentValue = asset.amount * asset.buyPrice; // Fallback to buy price if unknown
    }
    return total + currentValue;
  }, 0);
};

export const calculateProfitLoss = (asset: Asset, rates: MarketData | null) => {
  if (!rates) return { currentValue: 0, profit: 0, percentage: 0 };

  let currentPrice = 0;
  switch (asset.type) {
    case 'GOLD': currentPrice = rates.gramGold; break;
    case 'SILVER': currentPrice = rates.gramSilver; break;
    case 'USD': currentPrice = rates.usdTry; break;
    case 'EURO': currentPrice = rates.euroTry || 0; break;
    default: currentPrice = asset.buyPrice; break; 
  }

  const currentValue = asset.amount * currentPrice;
  const costBasis = asset.amount * asset.buyPrice;
  const profit = currentValue - costBasis;
  const percentage = costBasis > 0 ? (profit / costBasis) * 100 : 0;

  return { currentValue, profit, percentage };
};
