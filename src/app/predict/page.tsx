import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import PredictClient from "./PredictClient";
import { MockRacer } from "@/components/betting/VerticalGrid";
import { jstBusinessRaceDate } from "@/lib/business-day";

export default async function PredictPage(props: {
    searchParams: Promise<{ placeId?: string; raceNumber?: string; isPrivate?: string; eventId?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const searchParams = await props.searchParams;
    const placeId = searchParams.placeId;
    const raceNumber = searchParams.raceNumber ? parseInt(searchParams.raceNumber, 10) : 1;
    const isPrivate = searchParams.isPrivate === 'true';
    const eventId = searchParams.eventId || null;

    // 1. Find the venue
    const venue = VENUES.find(v => v.id === placeId) || null;

    // 2. Fetch Racer data if placeId and raceNumber are present
    let racers: MockRacer[] = [];

    if (venue) {
        // 営業日（深夜2時までは前日扱い）のレースを見る
        const entries = await prisma.raceEntry.findMany({
            where: {
                placeName: venue.name,
                raceNumber: raceNumber,
                raceDate: jstBusinessRaceDate()
            },
            include: {
                racer: true
            },
            orderBy: {
                boatNumber: 'asc'
            }
        });

        if (entries.length > 0) {
            racers = entries.map(entry => {
                let colorClasses = "bg-white text-slate-900 border-slate-200";
                if (entry.boatNumber === 2) colorClasses = "bg-slate-900 text-white border-slate-900";
                else if (entry.boatNumber === 3) colorClasses = "bg-red-600 text-white border-red-600";
                else if (entry.boatNumber === 4) colorClasses = "bg-blue-600 text-white border-blue-600";
                else if (entry.boatNumber === 5) colorClasses = "bg-yellow-400 text-slate-900 border-yellow-400";
                else if (entry.boatNumber === 6) colorClasses = "bg-emerald-600 text-white border-emerald-600";

                return {
                    boatNumber: entry.boatNumber,
                    name: entry.racer?.name || "選手情報なし",
                    class: entry.racer?.grade || "B1",
                    color: colorClasses,
                    isAbsent: entry.isAbsent || false,
                };
            });
        }
    }

    // fallback if no data found in DB (mock UI as requested)
    if (racers.length === 0) {
        // Optional: you could fetch fallback names or just keep it empty
        // The instruction said: "選手名部分を空欄（または「未定」）としてレンダリングする安全なフォールバックを必ず実装してください"
    }

    // Fetch schedule for deadlineAt
    let deadlineAt: Date | null = null;
    if (venue) {
        const schedule = await prisma.raceSchedule.findFirst({
            where: { placeName: venue.name, raceNumber, raceDate: jstBusinessRaceDate() },
            select: { deadlineAt: true },
        });
        if (schedule) deadlineAt = schedule.deadlineAt;
    }


    // Fetch event participant points if eventId is present
    let eventPoints: number | null = null;
    if (eventId && session?.user?.id) {
        const participant = await prisma.eventParticipant.findUnique({
            where: { eventId_userId: { eventId, userId: session.user.id } },
            select: { points: true },
        });
        eventPoints = participant?.points ?? null;
    }

    // raceDate (営業日基準のUTC midnight)
    const raceDateStr = jstBusinessRaceDate().toISOString();

    return (
        <PredictClient
            venue={venue}
            raceNumber={raceNumber}
            racers={racers}
            isPrivate={isPrivate}
            deadlineAt={deadlineAt?.toISOString() || null}
            eventId={eventId}
            eventPoints={eventPoints}
            raceDate={raceDateStr}
        />
    );
}
