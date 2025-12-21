'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { TradeModal } from '@/components/TradeModal'
import { useLanguage } from '@/context/LanguageContext'
import { TRANSLATIONS } from '@/lib/translations'

interface Trade {
    id: number
    symbol: string
    side: 'BUY' | 'SELL'
    qty: number
    price: number
    executed_at: string
}

interface Holding {
    symbol: string
    qty: number
    avgPrice: number
    totalCost: number
    currentPrice: number
    currentValue: number
    pnl: number
    pnlPercent: number
}

export default function PortfolioPage() {
    const { lang, setLang } = useLanguage()
    const t = TRANSLATIONS[lang]

    const [user, setUser] = useState<any>(null)
    const [trades, setTrades] = useState<Trade[]>([])
    const [holdings, setHoldings] = useState<Holding[]>([])
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Stats
    const [totalValue, setTotalValue] = useState(0)
    const [totalInvested, setTotalInvested] = useState(0)
    const [totalPnL, setTotalPnL] = useState(0)
    const [totalPnLPercent, setTotalPnLPercent] = useState(0)

    const supabase = createClient()

    // 1. Fetch User & Trades
    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                await fetchTrades(user.id)
            }
        }
        initData()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    // 2. Fetch Trades
    const fetchTrades = async (userId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('executed_at', { ascending: false })

        if (!error && data) {
            setTrades(data)
            await calculatePortfolio(data) // Trigger calculation
        }
        setIsLoading(false)
    }

    // 3. Calculate Portfolio (Holdings & Prices)
    const calculatePortfolio = async (tradeList: Trade[]) => {
        // A. Aggregate Trades into Holdings
        const tempHoldings: Record<string, { qty: number, cost: number }> = {}

        tradeList.slice().reverse().forEach(t => { // Process oldest to newest for accurate avg cost
            if (!tempHoldings[t.symbol]) tempHoldings[t.symbol] = { qty: 0, cost: 0 }

            if (t.side === 'BUY') {
                tempHoldings[t.symbol].qty += t.qty
                tempHoldings[t.symbol].cost += (t.price * t.qty)
            } else {
                // Sell logic: Reduce qty, reduce cost proportionally (Avg Cost basis)
                if (tempHoldings[t.symbol].qty > 0) {
                    const avgPrice = tempHoldings[t.symbol].cost / tempHoldings[t.symbol].qty
                    tempHoldings[t.symbol].qty -= t.qty
                    tempHoldings[t.symbol].cost -= (avgPrice * t.qty)
                }
            }
        })

        // B. Fetch Latest Prices for held symbols (Live + DB Fallback)
        const symbols = Object.keys(tempHoldings).filter(s => tempHoldings[s].qty > 0.00000001) // Filter out sold/empty

        let marketPrices: Record<string, number> = {}

        if (symbols.length > 0) {
            // 1. Fetch from DB first (Base layer)
            const { data: priceData } = await supabase
                .from('market_prices')
                .select('symbol, close, date')
                .in('symbol', symbols)
                .order('date', { ascending: false })

            if (priceData) {
                priceData.forEach(p => {
                    if (!marketPrices[p.symbol]) {
                        marketPrices[p.symbol] = p.close
                    }
                })
            }

            // 2. Fetch Live Price from Binance (Overlay)
            // This ensures unsupported DB assets (like MATIC) get a price
            const pricePromises = symbols.map(async (sym) => {
                try {
                    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`)
                    const data = await res.json()
                    if (data.price) {
                        return { symbol: sym, price: parseFloat(data.price) }
                    }
                } catch (e) {
                    // Ignore error, fallback to DB
                }
                return null
            })

            const liveResults = await Promise.all(pricePromises)
            liveResults.forEach(res => {
                if (res) {
                    marketPrices[res.symbol] = res.price
                }
            })
        }

        // C. Build Final Holdings Array
        let calcTotalValue = 0
        let calcTotalInvested = 0

        const finalHoldings: Holding[] = symbols.map(sym => {
            const h = tempHoldings[sym]
            const currentPrice = marketPrices[sym] ?? (h.cost / h.qty) // Fallback to avg purchase price if truly no data

            const currentValue = h.qty * currentPrice
            // Ensure cost isn't negative due to floating point errors
            const totalCost = Math.max(0, h.cost)

            calcTotalValue += currentValue
            calcTotalInvested += totalCost

            const pnl = currentValue - totalCost
            const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0

            return {
                symbol: sym,
                qty: h.qty,
                avgPrice: h.cost / h.qty,
                totalCost: totalCost,
                currentPrice: currentPrice,
                currentValue: currentValue,
                pnl: pnl,
                pnlPercent: pnlPercent
            }
        }).sort((a, b) => b.currentValue - a.currentValue)

        setHoldings(finalHoldings)
        setTotalValue(calcTotalValue)
        setTotalInvested(calcTotalInvested)
        setTotalPnL(calcTotalValue - calcTotalInvested)
        setTotalPnLPercent(calcTotalInvested > 0 ? ((calcTotalValue - calcTotalInvested) / calcTotalInvested) * 100 : 0)
    }

    const handleTradeAdded = () => {
        if (user) fetchTrades(user.id)
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                {/* Header (Simplified) */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        {t.portfolio.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {user.email}
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Summary Card - Updated with PnL */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-3 rounded-xl bg-gradient-to-br from-[#151515] to-[#111] p-8 border border-gray-800"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h2 className="text-gray-400 font-medium mb-1">{t.portfolio.totalBalance}</h2>
                                <div className="text-5xl font-bold text-white tracking-tight">
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${totalPnL >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                                    </div>
                                    <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-gray-500 text-sm mb-1">{t.portfolio.totalInvested}</div>
                                <div className="text-xl font-medium text-gray-300">
                                    ${totalInvested.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Holdings List (Detailed) */}
                    <div className="lg:col-span-2 rounded-xl bg-[#111] border border-gray-800 min-h-[400px] flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{t.portfolio.holdings}</h3>
                            <button
                                onClick={() => setIsTradeModalOpen(true)}
                                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                                disabled={!user}
                            >
                                + {t.portfolio.addTrade}
                            </button>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            {holdings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                                    <p>{t.portfolio.noHoldings}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-[#151515] text-xs uppercase text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">{t.portfolio.asset}</th>
                                            <th className="px-6 py-4 text-right">{t.portfolio.price}</th>
                                            <th className="px-6 py-4 text-right">{t.portfolio.balance}</th>
                                            <th className="px-6 py-4 text-right">{t.portfolio.return}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {holdings.map((h) => (
                                            <tr key={h.symbol} className="hover:bg-gray-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <a href={`/analysis/${h.symbol}`} className="cursor-pointer hover:opacity-80">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {h.symbol}
                                                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                        </div>
                                                        <div className="text-xs text-gray-500">{h.qty.toFixed(4)} {t.portfolio.shares}</div>
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-gray-200">${h.currentPrice.toLocaleString()}</div>
                                                    <div className="text-xs text-gray-500">{t.portfolio.avg}: ${h.avgPrice.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-medium text-white">${h.currentValue.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-bold ${h.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                                                    </div>
                                                    <div className={`text-xs ${h.pnl >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                                        {h.pnl >= 0 ? '+' : ''}${Math.abs(h.pnl).toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* 3. Recent Activity (Log) */}
                    <div className="rounded-xl bg-[#111] p-6 border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4">{t.portfolio.recentTrades}</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {trades.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm py-4">{t.portfolio.noHistory}</div>
                            ) : trades.map((t_item) => (
                                <div key={t_item.id} className="flex justify-between items-center p-3 rounded-lg bg-[#151515] hover:bg-[#1a1a1a] transition-colors border border-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${t_item.side === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {t_item.side}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{t_item.symbol}</div>
                                            <div className="text-xs text-gray-500">{new Date(t_item.executed_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-300">
                                            {t_item.qty} @ ${t_item.price}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {t.portfolio.total}: ${(t_item.qty * t_item.price).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isTradeModalOpen && (
                <TradeModal
                    isOpen={isTradeModalOpen}
                    onClose={() => setIsTradeModalOpen(false)}
                    onSuccess={handleTradeAdded}
                    userId={user?.id}
                />
            )}
        </div>
    )
}
