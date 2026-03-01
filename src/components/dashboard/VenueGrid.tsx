import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Map } from "lucide-react";

const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'SG': return 'bg-yellow-100 text-yellow-700';
        case 'G1': return 'bg-red-100 text-red-700';
        case 'G2': return 'bg-blue-100 text-blue-700';
        case 'G3': return 'bg-red-50 text-red-600';
        default: return 'bg-slate-100 text-slate-600';
    }
};

export async function VenueGrid() {
    // Determine today's date safely in JST to prevent UTC rollover issues
    const nowJst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const yyyy = nowJst.getFullYear();
    const mm = String(nowJst.getMonth() + 1).padStart(2, '0');
    const dd = String(nowJst.getDate()).padStart(2, '0');
    const searchDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

    const schedules = await prisma.raceSchedule.findMany({
        where: {
            raceDate: searchDate,
        }
    });

    // Collect active venue names
    const activeVenueNames = new Set(schedules.map(s => s.placeName));
    const now = new Date();

    return (
        <div className="mt-8 px-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-blue-600" /> 24 BOAT RACE VENUES
                </h2>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-200/50 px-2 py-0.5 rounded-sm">
                    全国24場
                </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {VENUES.map((venue) => {
                    const isActive = activeVenueNames.has(venue.name);
                    const grade = "一般"; // Placeholder fallback
                    const eventDay = "-日目"; // Placeholder fallback

                    if (!isActive) {
                        return (
                            <div key={venue.id} className="bg-slate-50 border border-slate-200/50 rounded-xl p-1.5 flex flex-col justify-between opacity-60 h-[76px] w-full">
                                <div className="flex justify-between items-center mt-1 w-full px-0.5 invisible">
                                    <span className="text-[8px] font-black px-1 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 leading-none">一般</span>
                                    <span className="text-[8px] font-bold text-slate-400 leading-none truncate ml-0.5">-日目</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="text-xs font-black text-slate-400 tracking-widest">{venue.name}</span>
                                </div>
                                <div className="w-full text-center py-0.5">
                                    <span className="text-[9px] font-bold text-slate-300 block leading-tight">非開催</span>
                                </div>
                            </div>
                        );
                    }

                    // Active venue details
                    const venueSchedules = schedules.filter(s => s.placeName === venue.name).sort((a, b) => a.raceNumber - b.raceNumber);
                    const nextRace = venueSchedules.find(s => new Date(s.deadlineAt) > now);
                    const isFinished = !nextRace;

                    return (
                        <Link href={`/place/${venue.id}`} key={venue.id} className="block transition-transform hover:scale-105 active:scale-95">
                            <div className="bg-white border-2 border-slate-100/80 rounded-xl p-1.5 flex flex-col justify-between shadow-sm relative overflow-hidden h-[76px] w-full">
                                {/* Visual accent bar on top for active races */}
                                <div className={`absolute top-0 left-0 w-full h-[3px] ${isFinished ? 'bg-slate-300' : 'bg-blue-500'}`}></div>

                                {/* Top: Grade & Day */}
                                <div className="flex justify-between items-center mt-1 w-full px-0.5">
                                    <span className={`text-[8px] font-black px-1 py-0.5 rounded-[3px] leading-none shrink-0 ${getGradeColor(grade)}`}>
                                        {grade}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400 leading-none truncate ml-0.5 shrink-0">
                                        {eventDay}
                                    </span>
                                </div>

                                {/* Center: Venue Name */}
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="text-xs font-black text-slate-800 tracking-widest">{venue.name}</span>
                                </div>

                                {/* Bottom: Next Race or Finished */}
                                <div className="w-full">
                                    {isFinished ? (
                                        <div className="bg-slate-100/80 rounded py-0.5 w-full text-center">
                                            <span className="text-[9px] font-bold text-slate-400 block leading-tight">本日終了</span>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 border border-blue-100/50 rounded flex justify-between items-center px-1 py-0.5">
                                            <span className="text-[9px] font-black text-blue-700 leading-tight">
                                                {nextRace.raceNumber}R
                                            </span>
                                            <span className="text-[9px] font-bold text-blue-600 flex items-center gap-0.5 leading-tight tracking-tighter shrink-0 ml-0.5">
                                                {new Date(nextRace.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
