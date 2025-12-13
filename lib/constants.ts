export const SUPPORTED_COINS = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'XRP', name: 'Ripple' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BCH', name: 'Bitcoin Cash' },
    { symbol: 'DOGE', name: 'Dogecoin' }
];

export const TOP_US_STOCKS = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'GOOGL', name: 'Alphabet (Google)' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
    { symbol: 'LLY', name: 'Eli Lilly' },
    { symbol: 'AVGO', name: 'Broadcom' }
];

export const POPULAR_SYMBOLS = SUPPORTED_COINS.map(c => c.symbol + 'USDT');
export const POPULAR_STOCKS = TOP_US_STOCKS.map(s => s.symbol);
