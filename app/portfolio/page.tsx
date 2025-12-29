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
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-[120px] md:pt-[140px]">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            {t.portfolio.title}
                        </h1>
                        <p className="text-muted-foreground mt-1">{t.portfolio.subtitle}</p>
                    </div>
                    <button
                        onClick={() => setIsTradeModalOpen(true)}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all shadow-lg shadow-primary/20"
                    >
                        + {t.portfolio.addTrade}
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card/30 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                        <p className="text-muted-foreground text-sm font-medium mb-1">{t.portfolio.totalBalance}</p>
                        <p className="text-3xl font-bold text-foreground">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-card/30 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                        <p className="text-muted-foreground text-sm font-medium mb-1">{t.portfolio.totalInvested}</p>
                        <p className="text-2xl font-bold text-foreground">
                            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-card/30 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                        <p className="text-muted-foreground text-sm font-medium mb-1">{t.portfolio.pl}</p>
                        <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-card/30 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                        <p className="text-muted-foreground text-sm font-medium mb-1">{t.portfolio.return}</p>
                        <p className={`text-2xl font-bold ${totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* Holdings Section */}
                <div className="bg-card/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-foreground">{t.portfolio.holdings}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 text-gray-200 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-6 py-4">{t.portfolio.asset}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.price}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.balance}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.avg}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.return}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 bg-black/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                                            {t.common.loading}
                                        </td>
                                    </tr>
                                ) : holdings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            {t.portfolio.noHoldings}
                                        </td>
                                    </tr>
                                ) : (
                                    holdings.map((h) => (
                                        <tr key={h.symbol} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                                                        {h.symbol.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <div className="text-base">{h.symbol}</div>
                                                        <div className="text-xs text-muted-foreground font-normal">{h.qty} {t.portfolio.shares}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-foreground font-mono">
                                                ${h.currentPrice.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <div className="text-foreground font-bold">${h.currentValue.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground">{t.portfolio.total}: ${h.totalCost.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-300 font-mono">
                                                ${h.avgPrice.toLocaleString()}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold font-mono ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                <div className="flex flex-col items-end">
                                                    <span>{h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%</span>
                                                    <span className="text-xs opacity-70">${h.pnl.toLocaleString()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Trades Section */}
                <div className="bg-card/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-12">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-foreground">{t.portfolio.recentTrades}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 text-gray-200 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-6 py-4">{t.portfolio.date}</th>
                                    <th className="px-6 py-4">{t.portfolio.asset}</th>
                                    <th className="px-6 py-4 text-center">{t.portfolio.type}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.shares}</th>
                                    <th className="px-6 py-4 text-right">{t.portfolio.price}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 bg-black/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                                            {t.common.loading}
                                        </td>
                                    </tr>
                                ) : trades.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            {t.portfolio.noHistory}
                                        </td>
                                    </tr>
                                ) : (
                                    trades.map((t) => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-gray-400">{new Date(t.executed_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-foreground">{t.symbol}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.side === 'BUY' ? 'bg-green-900/40 text-green-400 border border-green-500/20' : 'bg-red-900/40 text-red-400 border border-red-500/20'}`}>
                                                    {t.side}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-300">{t.qty}</td>
                                            <td className="px-6 py-4 text-right text-gray-300">${t.price.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                onSuccess={() => {
                    if (user) fetchTrades(user.id)
                }}
                userId={user?.id}
            />
        </div>
    )
}
