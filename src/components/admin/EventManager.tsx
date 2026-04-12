"use client";

import { useState, useEffect } from "react";
import { createEvent, getAllEvents, endEvent } from "@/actions/admin-events";
import { VENUES } from "@/lib/constants/venues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EventItem = {
    id: string;
    name: string;
    placeName: string;
    startDate: string;
    endDate: string;
    initialPt: number;
    isActive: boolean;
    _count: { participants: number };
};

export function EventManager() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [placeName, setPlaceName] = useState(VENUES[0].name);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [initialPt, setInitialPt] = useState(50000);
    const [message, setMessage] = useState("");

    const fetchEvents = async () => {
        const data = await getAllEvents();
        setEvents(data as any);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreate = async () => {
        if (!name || !startDate || !endDate) {
            setMessage("全項目を入力してください");
            return;
        }
        setLoading(true);
        setMessage("");
        const result = await createEvent({ name, placeName, startDate, endDate, initialPt });
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("イベントを作成しました");
            setName("");
            setStartDate("");
            setEndDate("");
            setInitialPt(50000);
            await fetchEvents();
        }
        setLoading(false);
    };

    const handleEnd = async (eventId: string) => {
        if (!confirm("このイベントを終了しますか？")) return;
        setLoading(true);
        const result = await endEvent(eventId);
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("イベントを終了しました");
            await fetchEvents();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* 作成フォーム */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">新規イベント作成</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">イベント名</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: GW限定ptバトル"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">対象場</label>
                        <select
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {VENUES.map((v) => (
                                <option key={v.id} value={v.name}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">開始日</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">終了日</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">初期pt</label>
                        <Input
                            type="number"
                            value={initialPt}
                            onChange={(e) => setInitialPt(Number(e.target.value))}
                        />
                    </div>
                </div>
                <Button onClick={handleCreate} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    {loading ? "作成中..." : "イベント作成"}
                </Button>
                {message && (
                    <p className={`text-xs font-bold ${message.includes("失敗") || message.includes("入力") ? "text-red-500" : "text-emerald-600"}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* イベント一覧 */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">イベント一覧</h3>
                {events.length === 0 ? (
                    <p className="text-xs text-slate-400">イベントはありません</p>
                ) : (
                    <div className="space-y-2">
                        {events.map((ev) => (
                            <div key={ev.id} className={`flex items-center justify-between p-3 rounded-lg border ${ev.isActive ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800">{ev.name}</span>
                                        {ev.isActive ? (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">開催中</span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">終了</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {ev.placeName} | {new Date(ev.startDate).toLocaleDateString("ja-JP")} 〜 {new Date(ev.endDate).toLocaleDateString("ja-JP")} | {ev.initialPt.toLocaleString()}pt | 参加者: {ev._count.participants}人
                                    </p>
                                </div>
                                {ev.isActive && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEnd(ev.id)}
                                        disabled={loading}
                                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                    >
                                        終了
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
