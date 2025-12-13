'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { SUPPORTED_COINS, TOP_US_STOCKS } from '@/lib/constants'

interface TradeModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    userId: string
}



export const TradeModal = ({ isOpen, onClose, onSuccess, userId }: TradeModalProps) => {
    const [assetType, setAssetType] = useState<'CRYPTO' | 'STOCK'>('CRYPTO')
    const [isCustomSymbol, setIsCustomSymbol] = useState(false)
    const [symbol, setSymbol] = useState('BTC')
    const [customSymbol, setCustomSymbol] = useState('')

    // Stock State
    const [stockMode, setStockMode] = useState<'SELECT' | 'MANUAL'>('SELECT')
    const [selectedStock, setSelectedStock] = useState(TOP_US_STOCKS[0].symbol)
    const [manualStockSymbol, setManualStockSymbol] = useState('')

    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
    const [qty, setQty] = useState('')
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState<'USD' | 'KRW'>('USD')
    const [exchangeRate, setExchangeRate] = useState(1450)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // Reset fields when asset type changes
    useEffect(() => {
        setSymbol('BTC')
        setCustomSymbol('')
        setStockMode('SELECT')
        setSelectedStock(TOP_US_STOCKS[0].symbol)
        setManualStockSymbol('')
        setQty('')
        setPrice('')
        if (assetType === 'STOCK') {
            setCurrency('USD')
        }
    }, [assetType])

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
                const data = await res.json()
                if (data && data.rates && data.rates.KRW) {
                    setExchangeRate(data.rates.KRW)
                }
            } catch (error) {
                console.error('Failed to fetch exchange rate:', error)
            }
        }
        fetchRate()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let finalSymbol = ''
            if (assetType === 'CRYPTO') {
                finalSymbol = isCustomSymbol ? customSymbol.toUpperCase() : symbol
            } else {
                finalSymbol = stockMode === 'MANUAL' ? manualStockSymbol.toUpperCase() : selectedStock
            }

            let finalPrice = parseFloat(price)
            if (currency === 'KRW') {
                finalPrice = finalPrice / exchangeRate
            }

            if (!finalSymbol || !qty || !price) {
                throw new Error('Please fill in all fields')
            }

            // Dual Check: Use prop OR fetch fresh
            let validUserId = userId
            if (!validUserId) {
                console.warn('UserId prop missing, fetching fresh session...')
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    validUserId = user.id
                } else {
                    throw new Error('User not logged in (Session missing)')
                }
            }

            const { error } = await supabase.from('trades').insert({
                user_id: validUserId,
                symbol: finalSymbol,
                side,
                qty: parseFloat(qty),
                price: finalPrice,
                executed_at: new Date().toISOString(),
            })

            if (error) throw error

            // Reset fields
            setQty('')
            setPrice('')
            setCustomSymbol('')
            setManualStockSymbol('')
            onSuccess()
            onClose()
            alert('Trade added successfully!')

        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    >
                        ✕
                    </button>

                    <h2 className="text-xl font-bold text-white mb-6">Add New Trade</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Asset Type Toggle */}
                        <div className="flex bg-[#1a1a1a] p-1 rounded-lg mb-4 border border-gray-800">
                            <button
                                type="button"
                                onClick={() => setAssetType('CRYPTO')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${assetType === 'CRYPTO'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Crypto
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssetType('STOCK')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${assetType === 'STOCK'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                US Stock
                            </button>
                        </div>

                        {/* Symbol Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    {assetType === 'CRYPTO' ? 'Coin Symbol' : 'Ticker Symbol'}
                                </label>

                                {assetType === 'CRYPTO' ? (
                                    !isCustomSymbol ? (
                                        <select
                                            value={symbol}
                                            onChange={(e) => {
                                                if (e.target.value === 'OTHER') {
                                                    setIsCustomSymbol(true)
                                                    setCustomSymbol('')
                                                } else {
                                                    setSymbol(e.target.value)
                                                }
                                            }}
                                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            {SUPPORTED_COINS.map(coin => (
                                                <option key={coin.symbol} value={coin.symbol}>
                                                    {coin.name} ({coin.symbol})
                                                </option>
                                            ))}
                                            <option value="OTHER">Other (Direct Input)</option>
                                        </select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={customSymbol}
                                                onChange={(e) => setCustomSymbol(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 uppercase"
                                                placeholder="SYMBOL"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomSymbol(false)}
                                                className="px-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    /* STOCK INPUT (SELECT or MANUAL) */
                                    stockMode === 'SELECT' ? (
                                        <select
                                            value={selectedStock}
                                            onChange={(e) => {
                                                if (e.target.value === 'OTHER') {
                                                    setStockMode('MANUAL')
                                                    setManualStockSymbol('')
                                                } else {
                                                    setSelectedStock(e.target.value)
                                                }
                                            }}
                                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            {TOP_US_STOCKS.map(stock => (
                                                <option key={stock.symbol} value={stock.symbol}>
                                                    {stock.name} ({stock.symbol})
                                                </option>
                                            ))}
                                            <option value="OTHER">Other (Direct Input)</option>
                                        </select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={manualStockSymbol}
                                                onChange={(e) => setManualStockSymbol(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 uppercase"
                                                placeholder="AAPL"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setStockMode('SELECT')}
                                                className="px-3 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Type (Buy/Sell) */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Type</label>
                                <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setSide('BUY')}
                                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${side === 'BUY' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSide('SELL')}
                                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${side === 'SELL' ? 'bg-red-500/20 text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Sell
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Currency Toggle */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Currency</label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="currency"
                                        checked={currency === 'USD'}
                                        onChange={() => setCurrency('USD')}
                                        className="accent-blue-500"
                                    />
                                    <span className={currency === 'USD' ? 'text-white' : 'text-gray-500'}>USD ($)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="currency"
                                        checked={currency === 'KRW'}
                                        onChange={() => setCurrency('KRW')}
                                        className="accent-blue-500"
                                    />
                                    <span className={currency === 'KRW' ? 'text-white' : 'text-gray-500'}>KRW (₩)</span>
                                </label>
                            </div>
                            {currency === 'KRW' && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                    <span>Rate: 1 USD ≈ </span>
                                    <input
                                        type="number"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                                        className="bg-transparent border-b border-gray-700 w-16 text-center text-gray-300 focus:outline-none focus:border-blue-500"
                                    />
                                    <span>KRW</span>
                                </div>
                            )}
                        </div>

                        {/* Price & Quantity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Price ({currency})</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Total Estimate */}
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Value (USD)</span>
                                <span className="font-bold text-blue-400">
                                    $ {((parseFloat(price || '0') / (currency === 'KRW' ? exchangeRate : 1)) * parseFloat(qty || '0')).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Add Trade'}
                        </button>

                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
