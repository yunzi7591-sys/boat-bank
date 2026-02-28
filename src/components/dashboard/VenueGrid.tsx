import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Map } from "lucide-react";

export async function VenueGrid() {
    // Fetch today's schedule to determine active venues
    const todayStr = new Date().toISOString().split('T')[0];
    const schedules = await prisma.raceSchedule.findMany({
        where: {
            raceDate: new Date(todayStr),
        }
    });

    // Collect active venue names
    const activeVenueNames = new Set(schedules.map(s => s.placeName));

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

                    // Find the latest deadline or status for this venue if active (simplified for MVP)
                    const venueSchedules = schedules.filter(s => s.placeName === venue.name);
                    // Just as an example, if there are schedules, we consider it active
                    const isFinished = isActive && venueSchedules.every(s => new Date(s.deadlineAt) < new Date());

                    if (!isActive) {
                        // Inactive venue
                        return (
                            <div
                                key={venue.id}
                                className="bg-slate-100 border border-slate-200/50 rounded-xl p-2.5 flex flex-col items-center justify-center opacity-60"
                            >
                                <span className="text-xs font-black text-slate-400 mb-1">{venue.name}</span>
                                <span className="text-[9px] font-bold text-slate-300">-- --</span>
                            </div>
                        );
                    }

                    // Active venue
                    return (
                        <Link href={`/place/${venue.id}`} key={venue.id} className="block transition-transform hover:scale-105 active:scale-95">
                            <div className="bg-white border-2 border-slate-100 rounded-xl p-2.5 flex flex-col items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden h-full">

                                {/* Visual accent bar on top for active races */}
                                {!isFinished && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                )}
                                {isFinished && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                                )}

                                <span className="text-xs font-black text-slate-800 mb-1">{venue.name}</span>

                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-full text-center tracking-tighter ${isFinished
                                        ? "bg-slate-100 text-slate-500"
                                        : "bg-green-100 text-green-700 animate-pulse"
                                    }`}>
                                    {isFinished ? "発売終了" : "受付中"}
                                </div>

                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
