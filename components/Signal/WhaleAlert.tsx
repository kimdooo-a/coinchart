'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

type WhaleTx = {
    id: string;
    symbol: string;
    amount: number;
    from: string;
    to: string;
    valueUSD: number;
    timestamp: number;
    type: 'INFLOW' | 'OUTFLOW' | 'TRANSFER';
};

const COINS = ['BTC', 'ETH', 'XRP', 'SOL', 'USDT'];
const EXCHANGES = ['Binance', 'Upbit', 'Coinbase', 'Kraken', 'OKX'];

export default function WhaleAlert() {
    const { lang } = useLanguage();
    const [txs, setTxs] = useState<WhaleTx[]>([]);

    const generateTx = (): WhaleTx => {
        const coin = COINS[Math.floor(Math.random() * COINS.length)];
        const isTransfer = Math.random() > 0.5;
        const fromEx = Math.random() > 0.5;

        let subType: 'INFLOW' | 'OUTFLOW' | 'TRANSFER' = 'TRANSFER';
        let from = 'Unknown Filter';
        let to = 'Unknown Wallet';

        if (!isTransfer) {
            if (fromEx) {
                subType = 'OUTFLOW';
                from = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
            } else {
                subType = 'INFLOW';
                to = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
            }
        }

        const amountBase = coin === 'BTC' ? 50 : coin === 'ETH' ? 500 : 1000000;
        const amount = Math.floor(Math.random() * amountBase) + (amountBase / 10);

        // Approx Prices
        const prices: Record<string, number> = { BTC: 96000, ETH: 3600, XRP: 2.5, SOL: 230, USDT: 1 };
        const val = amount * prices[coin];

        return {
            id: Math.random().toString(36).substr(2, 9),
            symbol: coin,
            amount: parseFloat(amount.toFixed(2)),
            from,
            to,
            valueUSD: val,
            timestamp: Date.now(),
            type: subType
        };
    };

    useEffect(() => {
        // Init with some data
        const initial = Array.from({ length: 3 }).map(generateTx);
        setTxs(initial);

        const interval = setInterval(() => {
            setTxs(prev => [generateTx(), ...prev].slice(0, 10));
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🐋 {lang === 'ko' ? '실시간 고래 경보 (Simulation)' : 'Live Whale Alert (Simulation)'}
            </h3>
            <div className="space-y-3">
                <AnimatePresence>
                    {txs.map((tx) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-4 rounded-xl border flex items-center justify-between shadow-lg backdrop-blur-md ${tx.type === 'INFLOW' ? 'bg-red-900/20 border-red-900/50' :
                                    tx.type === 'OUTFLOW' ? 'bg-green-900/20 border-green-900/50' :
                                        'bg-gray-800/40 border-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${tx.type === 'INFLOW' ? 'bg-red-500/20 text-red-400' :
                                        tx.type === 'OUTFLOW' ? 'bg-green-500/20 text-green-400' :
                                            'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {tx.type === 'INFLOW' ? '📉' : tx.type === 'OUTFLOW' ? '📈' : '↔️'}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">
                                        {tx.amount.toLocaleString()} {tx.symbol}
                                        <span className="text-gray-400 text-sm font-normal ml-2">({formatMoney(tx.valueUSD)})</span>
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2">
                                        <span>{tx.from}</span>
                                        <span className="text-gray-600">➔</span>
                                        <span className={tx.type === 'INFLOW' ? 'text-white font-bold' : ''}>{tx.to}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 font-mono">
                                {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
