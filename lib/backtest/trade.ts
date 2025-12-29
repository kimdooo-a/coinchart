import { Trade } from '@/types/backtest';

export function processTrade(): Trade {
    return {
        id: '0',
        entryPrice: 0,
        exitPrice: 0,
        entryTime: 0,
        exitTime: 0,
        direction: 'LONG',
        pnl: 0,
        pnlPercent: 0
    };
}
