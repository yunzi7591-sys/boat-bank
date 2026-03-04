"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, Wallet, Activity, ArrowLeft, Loader2, DatabaseZap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserDashboardData } from '@/actions/dashboard';

const STADIUMS = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖", "蒲郡", "常滑",
    "津", "三国", "びわこ", "住之江", "尼崎", "鳴門", "丸亀", "児島",
    "宮島", "徳山", "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

const GRADES = [
    { num: 1, label: "SG", color: "#fbbf24" },
    { num: 2, label: "G1", color: "#10b981" },
    { num: 3, label: "G2", color: "#1e293b" },
    { num: 4, label: "G3", color: "#ef4444" },
    { num: 5, label: "一般", color: "#3b82f6" },
];

export default function DashboardPage() {
    const [summaryData, setSummaryData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await getUserDashboardData();
                if (res?.error) {
                    setError(res.error);
                } else if (res?.bets) {
                    setSummaryData(res.bets);
                }
            } catch (err: any) {
                setError(err.message || "Failed to fetch dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Process Data
    const { summary, stadiumData, gradeData, boatData, hasData } = useMemo(() => {
        if (!summaryData || summaryData.length === 0) {
            return { summary: null, stadiumData: [], gradeData: [], boatData: [], hasData: false };
        }

        let totalBet = 0;
        let totalRefund = 0;
        let hitCount = 0;

        const stMap: Record<number, { bet: number, refund: number }> = {};
        const grMap: Record<number, { bet: number, refund: number }> = {};
        const boatMap: Record<number, { bet: number, refund: number }> = {};

        summaryData.forEach((bet) => {
            totalBet += bet.betAmount;
            totalRefund += bet.refundAmount;
            if (bet.refundAmount > 0) hitCount++;

            const stCode = bet.race?.stadiumNumber;
            const grCode = bet.race?.gradeNumber;
            const bNum = bet.slotNumber;

            if (stCode) {
                if (!stMap[stCode]) stMap[stCode] = { bet: 0, refund: 0 };
                stMap[stCode].bet += bet.betAmount;
                stMap[stCode].refund += bet.refundAmount;
            }

            if (grCode) {
                if (!grMap[grCode]) grMap[grCode] = { bet: 0, refund: 0 };
                grMap[grCode].bet += bet.betAmount;
                grMap[grCode].refund += bet.refundAmount;
            }

            if (bNum) {
                if (!boatMap[bNum]) boatMap[bNum] = { bet: 0, refund: 0 };
                boatMap[bNum].bet += bet.betAmount;
                boatMap[bNum].refund += bet.refundAmount;
            }
        });

        const overallRecovery = totalBet > 0 ? (totalRefund / totalBet) * 100 : 0;
        const hitRate = summaryData.length > 0 ? (hitCount / summaryData.length) * 100 : 0;

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
        }).filter(d => d.bet > 0);

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

        // Prepare Boat Number Data
        const bData = Array.from({ length: 6 }).map((_, i) => {
            const num = i + 1;
            const d = boatMap[num] || { bet: 0, refund: 0 };
            const recovery = d.bet > 0 ? (d.refund / d.bet) * 100 : 0;
            const betRatio = totalBet > 0 ? (d.bet / totalBet) * 100 : 0;
            return {
                name: `${num}枠`,
                recovery: parseFloat(recovery.toFixed(1)),
                betRatio: parseFloat(betRatio.toFixed(1)),
                fullBet: d.bet,
                fullRefund: d.refund
            };
        });

        return {
            summary: { totalBet, totalRefund, overallRecovery, hitRate, totalBets: summaryData.length },
            stadiumData: stData,
            gradeData: grData,
            boatData: bData,
            hasData: true
        };
    }, [summaryData]);

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

    // Tooltip for Radar Chart
    const CustomRadarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border rounded-lg p-3 shadow-lg text-xs font-bold ring-1 ring-slate-100">
                    <p className="text-slate-800 font-black mb-1.5 pb-1.5 border-b">{label}</p>
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="text-blue-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 投資割合</span>
                        <span className="text-slate-800">{data.betRatio}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 回収率</span>
                        <span className={data.recovery >= 100 ? 'text-emerald-600' : 'text-rose-600'}>{data.recovery}%</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-bold tracking-wider">LOADING DATA...</p>
            </div>
        );
    }

    if (error && !summaryData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-4">
                <div className="bg-rose-50 text-rose-600 p-6 rounded-xl border border-rose-100 text-center max-w-md w-full">
                    <DatabaseZap className="w-10 h-10 mx-auto mb-4 opacity-50" />
                    <h2 className="font-bold mb-2">Error Loading Dashboard</h2>
                    <p className="text-sm opacity-80 mb-6">{error}</p>
                    <Link href="/mypage">
                        <Button className="bg-rose-600 hover:bg-rose-700">マイページへ戻る</Button>
                    </Link>
                </div>
            </div>
        );
    }

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

                {!hasData || summary === null ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <DatabaseZap className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-700 mb-2">No Data Available</h2>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                            まだ投票データがありません。レースに投票して、あなただけのポートフォリオ分析を作成しましょう。
                        </p>
                        <Link href="/">
                            <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg px-8 py-6 font-bold text-base shadow-lg shadow-blue-500/30">
                                レースを探す
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
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

                        {/* Main Charts Layout */}
                        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

                            {/* 2. Stadium Analysis Chart (Main, Top) */}
                            {stadiumData.length > 0 && (
                                <Card className="border-none shadow-sm lg:col-span-3 flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[15px] font-black tracking-wider text-slate-800">競艇場別 回収率分析</CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400">水面ごとの得意・不得意が一目でわかります</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 h-[300px] pt-4">
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
                                                <Bar dataKey="recovery" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                                    {stadiumData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.recovery >= 100 ? '#10b981' : '#f43f5e'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 3. Grade Analysis Chart (Sub L) */}
                            {gradeData.length > 0 && (
                                <Card className="border-none shadow-sm lg:col-span-1 flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[15px] font-black tracking-wider text-slate-800">グレード別 投資比率</CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400">大穴狙いか堅実派かのポートフォリオ</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 h-[300px] flex items-center justify-center pt-0">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={gradeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
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
                            )}

                            {/* 4. Boat Number Radar Chart (Sub R) */}
                            {boatData.length > 0 && (
                                <Card className="border-none shadow-sm lg:col-span-2 flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[15px] font-black tracking-wider text-slate-800">枠番別 傾向分析</CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400">自分自身のイン狙い・アウト狙いの実力値と投資割合</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-[300px] flex items-center pt-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={boatData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />

                                                <Radar name="投資割合 (%)" dataKey="betRatio" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                                <Radar name="回収率 (%)" dataKey="recovery" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />

                                                <RechartsTooltip content={<CustomRadarTooltip />} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
