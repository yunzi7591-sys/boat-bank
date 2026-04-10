import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Map } from "lucide-react";
import { RefreshButton } from "./RefreshButton";

const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'SG': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'G1': return 'bg-red-50 text-red-600 border-red-100';
        case 'G2': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'G3': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
};

export async function VenueGrid() {
    const nowJst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const yyyy = nowJst.getFullYear();
    const mm = String(nowJst.getMonth() + 1).padStart(2, '0');
    const dd = String(nowJst.getDate()).padStart(2, '0');
    const searchDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

    const schedules = await prisma.raceSchedule.findMany({
        where: { raceDate: searchDate }
    });

    const activeVenueNames = new Set(schedules.map(s => s.placeName));
    const now = new Date();

    return (
        <div className="mt-0">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-500" />
                    レース場一覧
                    <RefreshButton />
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold">
                    全国24場
                </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {VENUES.map((venue) => {
                    const isActive = activeVenueNames.has(venue.name);
                    const venueSchedules = schedules.filter(s => s.placeName === venue.name).sort((a, b) => a.raceNumber - b.raceNumber);

                    const grade = venueSchedules.length > 0 && venueSchedules[0].grade ? venueSchedules[0].grade : "一般";
                    const eventDay = venueSchedules.length > 0 && venueSchedules[0].day ? venueSchedules[0].day : "";

                    if (!isActive) {
                        return (
                            <div key={venue.id} className="bg-slate-50/80 border border-slate-100 rounded-lg p-1.5 opacity-30 h-[60px] flex flex-col items-center justify-center">
                                <span className="text-[12px] font-bold text-slate-400">{venue.name}</span>
                                <span className="text-[8px] text-slate-300 mt-0.5">非開催</span>
                            </div>
                        );
                    }

                    const nextRace = venueSchedules.find(s => new Date(s.deadlineAt) > now);
                    const isFinished = !nextRace;

                    return (
                        <Link href={`/place/${venue.id}`} key={venue.id} className="block active:scale-95 transition-transform">
                            <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col items-center justify-between shadow-[0_2px_8px_rgba(50,50,93,0.08)] h-[60px] relative overflow-hidden">
                                {/* Top accent */}
                                <div className={`absolute top-0 left-0 right-0 h-[2px] ${isFinished ? 'bg-slate-200' : 'bg-emerald-500'}`} />

                                {/* Grade + Day */}
                                <div className="flex items-center gap-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${getGradeColor(grade)}`}>
                                        {grade}
                                    </span>
                                    {eventDay && (
                                        <span className="text-[9px] text-slate-400 font-medium">{eventDay}</span>
                                    )}
                                </div>

                                {/* Venue Name */}
                                <span className="text-[13px] font-bold text-slate-800">{venue.name}</span>

                                {/* Status */}
                                {isFinished ? (
                                    <span className="text-[9px] text-slate-400 font-medium">終了</span>
                                ) : (
                                    <span className="text-[9px] font-bold text-emerald-600">
                                        {nextRace.raceNumber}R · {new Date(nextRace.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
