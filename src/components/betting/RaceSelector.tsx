"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VENUES } from "@/lib/constants/venues";
import { Button } from "@/components/ui/button";
import { MapPin, Flag } from "lucide-react";

export function RaceSelector() {
    const router = useRouter();
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

    const handleSelectRace = (raceNumber: number) => {
        if (selectedPlaceId) {
            router.push(`/predict/new?placeId=${selectedPlaceId}&raceNumber=${raceNumber}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 pb-24">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex-1">
                {!selectedPlaceId ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            会場を選択
                        </h2>
                        <p className="text-xs text-slate-500 font-bold mb-6">予想するボートレース場を選んでください</p>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {VENUES.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedPlaceId(v.id)}
                                    className="bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                                >
                                    <span className="text-[10px] font-black text-slate-400">{v.id}</span>
                                    <span className="font-extrabold text-sm">{v.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
                                    <Flag className="w-5 h-5 text-indigo-500" />
                                    レースを選択
                                </h2>
                                <p className="text-xs text-slate-500 font-bold">
                                    {VENUES.find(v => v.id === selectedPlaceId)?.name}の何レースを予想しますか？
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPlaceId(null)} className="text-xs font-bold text-slate-400">
                                会場変更
                            </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(r => (
                                <button
                                    key={r}
                                    onClick={() => handleSelectRace(r)}
                                    className="bg-white border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 text-slate-700 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 font-black text-xl"
                                >
                                    {r}<span className="text-[10px] opacity-70">R</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
