import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import PredictClient from "./PredictClient";
import { MockRacer } from "@/components/betting/VerticalGrid";
import { getUserPoints } from "@/actions/auth";

export default async function PredictPage(props: {
    searchParams: Promise<{ placeId?: string; raceNumber?: string; isPrivate?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const searchParams = await props.searchParams;
    const placeId = searchParams.placeId;
    const raceNumber = searchParams.raceNumber ? parseInt(searchParams.raceNumber, 10) : 1;
    const isPrivate = searchParams.isPrivate === 'true';

    // 1. Find the venue
    const venue = VENUES.find(v => v.id === placeId) || null;

    // 2. Fetch Racer data if placeId and raceNumber are present
    let racers: MockRacer[] = [];

    if (venue) {
        // We look for today's entries
        const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
        const currentDate = new Date(todayStr);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const localDateStr = `${yyyy}-${mm}-${dd}`;

        const entries = await prisma.raceEntry.findMany({
            where: {
                placeName: venue.name,
                raceNumber: raceNumber,
                raceDate: new Date(`${localDateStr}T00:00:00.000Z`)
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
                    color: colorClasses
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
        const todayStr2 = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
        const cd2 = new Date(todayStr2);
        const localDateStr2 = `${cd2.getFullYear()}-${String(cd2.getMonth() + 1).padStart(2, '0')}-${String(cd2.getDate()).padStart(2, '0')}`;
        const schedule = await prisma.raceSchedule.findFirst({
            where: { placeName: venue.name, raceNumber, raceDate: new Date(`${localDateStr2}T00:00:00.000Z`) },
            select: { deadlineAt: true },
        });
        if (schedule) deadlineAt = schedule.deadlineAt;
    }

    const userPoints = await getUserPoints();

    return (
        <PredictClient
            venue={venue}
            raceNumber={raceNumber}
            racers={racers}
            userPoints={userPoints}
            isPrivate={isPrivate}
            deadlineAt={deadlineAt?.toISOString() || null}
        />
    );
}
