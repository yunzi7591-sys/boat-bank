"use client";

import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- MOCK DATA GENERATION ---
const STADIUMS = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖", "蒲郡", "常滑",
    "津", "三国", "びわこ", "住之江", "尼崎", "鳴門", "丸亀", "児島",
    "宮島", "徳山", "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

const GRADES = [
    { num: 1, label: "SG", color: "#fbbf24" },    // amber-400
    { num: 2, label: "G1", color: "#10b981" },    // emerald-500
    { num: 3, label: "G2", color: "#1e293b" },    // slate-800
    { num: 4, label: "G3", color: "#ef4444" },    // red-500
    { num: 5, label: "一般", color: "#3b82f6" },   // blue-500
];

// Generate 500 random bets based on the requested schema logic
const MOCK_BETS = Array.from({ length: 500 }).map((_, i) => {
    // Bias towards some stadiums for realistic data curves
    const stadiumWeights = [2, 1, 1, 3, 2, 1, 4, 1, 1, 1, 2, 5, 3, 1, 2, 1, 1, 1, 1, 3, 2, 4, 1, 2];
    let stNum = 1;
    let stRand = Math.random() * stadiumWeights.reduce((a, b) => a + b, 0);
    for (let j = 0; j < stadiumWeights.length; j++) {
        stRand -= stadiumWeights[j];
        if (stRand <= 0) { stNum = j + 1; break; }
    }

    // Grades (1=SG(rare), 5=Ippan(common))
    const gradeNum = Math.random() < 0.1 ? 1 : Math.random() < 0.25 ? 2 : Math.random() < 0.35 ? 3 : Math.random() < 0.5 ? 4 : 5;

    // Bet 1,000 ~ 50,000
    const betAmount = (Math.floor(Math.random() * 50) + 1) * 1000;

    // Hit rate ~ 28%
    const isHit = Math.random() < 0.28;

    // If hit, refund is between 0.5x and 5.0x of bet (sometimes big hits, mostly small)
    let refundMultiplier = 0;
    if (isHit) {
        refundMultiplier = Math.random() < 0.9 ? (Math.random() * 1.5 + 0.5) : (Math.random() * 10 + 2);
    }
    const refundAmount = isHit ? Math.floor(betAmount * refundMultiplier) : 0;

    return {
        id: `bet_${i}`,
        race: { stadiumNumber: stNum, gradeNumber: gradeNum },
        betAmount,
        refundAmount
    };
});

// --- DASHBOARD COMPONENT ---
export default function DashboardPage() {

    // Process Data
    const { summary, stadiumData, gradeData } = useMemo(() => {
        let totalBet = 0;
        let totalRefund = 0;
        let hitCount = 0;

        const stMap: Record<number, { bet: number, refund: number }> = {};
        const grMap: Record<number, { bet: number, refund: number }> = {};

        MOCK_BETS.forEach(bet => {
            totalBet += bet.betAmount;
            totalRefund += bet.refundAmount;
            if (bet.refundAmount > 0) hitCount++;

            const stCode = bet.race.stadiumNumber;
            const grCode = bet.race.gradeNumber;

            if (!stMap[stCode]) stMap[stCode] = { bet: 0, refund: 0 };
            stMap[stCode].bet += bet.betAmount;
            stMap[stCode].refund += bet.refundAmount;

            if (!grMap[grCode]) grMap[grCode] = { bet: 0, refund: 0 };
            grMap[grCode].bet += bet.betAmount;
            grMap[grCode].refund += bet.refundAmount;
        });

        const overallRecovery = totalBet > 0 ? (totalRefund / totalBet) * 100 : 0;
        const hitRate = MOCK_BETS.length > 0 ? (hitCount / MOCK_BETS.length) * 100 : 0;

        // Prepare Stadium Data (Sort by venue 1-24)
        const stData = Array.from({ length: 24 }).map((_, i) => {
            const num = i + 1;
            const d = stMap[num] || { bet: 0, refund: 0 };
            const recovery = d.bet > 0 ? (d.refund / d.bet) * 100 : 0;
            return {
                name: STADIUMS[i],
                recovery: parseFloat(recovery.toFixed(1)),
                bet: d.bet,
                refund: d.refund
            };
        }).filter(d => d.bet > 0); // Only show stadiums with history

        // Prepare Grade Data
        const grData = GRADES.map(g => {
            const d = grMap[g.num] || { bet: 0, refund: 0 };
            const recovery = d.bet > 0 ? (d.refund / d.bet) * 100 : 0;
            return {
                name: g.label,
                value: d.bet,
                recovery: parseFloat(recovery.toFixed(1)),
                fill: g.color
            };
        }).filter(d => d.value > 0);

        return {
            summary: { totalBet, totalRefund, overallRecovery, hitRate, totalBets: MOCK_BETS.length },
            stadiumData: stData,
            gradeData: grData
        };
    }, []);

    // Tooltip for Pie Chart
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border-none rounded-lg p-3 text-white shadow-xl text-xs font-bold ring-1 ring-white/20">
                    <p className="text-slate-300 mb-1">{data.name}戦の成績</p>
                    <p className="text-white text-sm">投資: ¥{data.value.toLocaleString()}</p>
                    <p className={data.recovery >= 100 ? 'text-emerald-400' : 'text-rose-400'}>
                        回収率: {data.recovery}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // Tooltip for Bar Chart
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border rounded-lg p-3 shadow-lg text-xs font-bold">
                    <p className="text-slate-500 mb-1">{label}の成績</p>
                    <p className="text-slate-800">投資: ¥{data.bet.toLocaleString()}</p>
                    <p className="text-slate-800 mb-1">払戻: ¥{data.refund.toLocaleString()}</p>
                    <p className={`text-sm ${data.recovery >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        回収率: {data.recovery}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
                <Link href="/mypage">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1 text-center font-black text-lg tracking-wider flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    PORTFOLIO DASHBOARD
                </div>
                <div className="w-10"></div>
            </div>

            <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8 mt-2">

                {/* 1. Summary Cards */}
                <div>
                    <h2 className="text-sm font-extrabold text-slate-500 mb-3 ml-1 tracking-wider uppercase">Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 lg:p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-slate-500 font-bold mb-1">
                                    <Wallet className="w-4 h-4 text-blue-500" />
                                    <span className="text-[11px] lg:text-xs">総投資額</span>
                                </div>
                                <div className="text-lg lg:text-2xl font-black text-slate-800">
                                    ¥{summary.totalBet.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 lg:p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-slate-500 font-bold mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[11px] lg:text-xs">総回収額</span>
                                </div>
                                <div className="text-lg lg:text-2xl font-black text-slate-800">
                                    ¥{summary.totalRefund.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`border-none shadow-sm hover:shadow-md transition-shadow ${summary.overallRecovery >= 100 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <CardContent className="p-4 lg:p-5 flex flex-col justify-center">
                                <div className={`flex items-center gap-2 font-bold mb-1 ${summary.overallRecovery >= 100 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {summary.overallRecovery >= 100 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    <span className="text-[11px] lg:text-xs">総回収率</span>
                                </div>
                                <div className={`text-lg lg:text-2xl font-black ${summary.overallRecovery >= 100 ? 'text-emerald-900' : 'text-rose-900'}`}>
                                    {summary.overallRecovery.toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 lg:p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-slate-500 font-bold mb-1">
                                    <Target className="w-4 h-4 text-sky-500" />
                                    <span className="text-[11px] lg:text-xs">的中率 ({summary.totalBets}戦)</span>
                                </div>
                                <div className="text-lg lg:text-2xl font-black text-slate-800">
                                    {summary.hitRate.toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* 2. Stadium Analysis Chart (Main) */}
                    <Card className="border-none shadow-sm lg:col-span-2 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[15px] font-black tracking-wider text-slate-800">競艇場別 回収率分析</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400">水面ごとの得意・不得意が一目でわかります</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[350px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stadiumData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `${val}%`}
                                        domain={[0, 'auto']}
                                    />
                                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                    {/* Line to indicate 100% threshold */}
                                    <Bar dataKey="recovery" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {stadiumData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.recovery >= 100 ? '#10b981' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 3. Grade Analysis Chart (Sub) */}
                    <Card className="border-none shadow-sm flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[15px] font-black tracking-wider text-slate-800">グレード別 投資比率</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400">大穴狙いか堅実派かのポートフォリオ</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[300px] flex items-center justify-center pt-0">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={gradeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {gradeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
