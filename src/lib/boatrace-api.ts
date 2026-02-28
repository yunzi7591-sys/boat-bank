import { prisma } from "@/lib/prisma";
import { VENUES } from "@/lib/constants/venues";

const SCHEDULE_API_URL = "https://boatraceopenapi.github.io/programs/v2/today.json";
const RESULTS_API_URL = "https://boatraceopenapi.github.io/results/v2/today.json";

export async function syncTodaySchedule() {
    try {
        console.log(`[API] Fetching schedule from ${SCHEDULE_API_URL}...`);

        const res = await fetch(SCHEDULE_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Schedule API Fetch failed");

        const data = await res.json();
        const programs = data.programs || [];

        if (programs.length === 0) {
            return { success: false, error: "No events today." };
        }

        let syncedCount = 0;

        for (const prog of programs) {
            // "race_stadium_number": 1 -> id: "01"
            const stadiumId = prog.race_stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);

            if (!venue) continue; // Unknown venue

            const placeName = venue.name;
            const raceNumber = prog.race_number;
            const raceDate = new Date(prog.race_date); // "2026-02-28" resulting in UTC 00:00

            // "race_closed_at": "2026-02-28 15:48:00" -> parsing correctly in Japan time is tricky without a proper library, 
            // but for simplicity, we treat the exact string as UTC or parse as local. Let's append JST +0900.
            const deadlineAt = new Date(`${prog.race_closed_at.replace(' ', 'T')}+09:00`);

            await prisma.raceSchedule.upsert({
                where: {
                    placeName_raceNumber_raceDate: {
                        placeName,
                        raceNumber,
                        raceDate,
                    }
                },
                update: { deadlineAt },
                create: {
                    placeName,
                    raceNumber,
                    raceDate,
                    deadlineAt,
                }
            });
            syncedCount++;
        }

        return { success: true, count: syncedCount };
    } catch (e: any) {
        console.error("[API Error] Failed to sync schedule:", e);
        return { success: false, error: e.message };
    }
}

export async function fetchAndSaveRaceResult(placeName: string, raceNumber: number) {
    try {
        console.log(`[API] Fetching result for ${placeName} R${raceNumber} from ${RESULTS_API_URL}...`);

        const res = await fetch(RESULTS_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Result API Fetch failed");

        const data = await res.json();
        const results = data.results || [];

        // Find stadiumId
        const venue = VENUES.find(v => v.name === placeName);
        if (!venue) throw new Error("Invalid place name");

        const stadiumNumber = parseInt(venue.id, 10);
        const raceResult = results.find((r: any) => r.race_stadium_number === stadiumNumber && r.race_number === raceNumber);

        if (!raceResult) {
            throw new Error("Result not found for this race yet.");
        }

        const raceDate = new Date(raceResult.race_date);

        // Parse boats to find 1st, 2nd, 3rd places
        const boats = raceResult.boats || [];
        const first = boats.find((b: any) => b.racer_place_number === 1)?.racer_boat_number;
        const second = boats.find((b: any) => b.racer_place_number === 2)?.racer_boat_number;
        const third = boats.find((b: any) => b.racer_place_number === 3)?.racer_boat_number;

        if (!first || !second || !third) {
            throw new Error("Match not fully concluded (Missing place numbers).");
        }

        // Parse payouts
        const payouts = raceResult.payouts || {};
        const refundsData: any[] = [];

        // Map payouts to our format
        // trifecta -> 3TR (3連単)
        if (payouts.trifecta && payouts.trifecta.length > 0) {
            payouts.trifecta.forEach((p: any) => {
                refundsData.push({ type: "3TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout });
            });
        }
        // trio -> 3PL (3連複)
        if (payouts.trio && payouts.trio.length > 0) {
            payouts.trio.forEach((p: any) => {
                refundsData.push({ type: "3PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout });
            });
        }
        // exacta -> 2TR (2連単)
        if (payouts.exacta && payouts.exacta.length > 0) {
            payouts.exacta.forEach((p: any) => {
                refundsData.push({ type: "2TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout });
            });
        }
        // quinella -> 2PL (2連複)
        if (payouts.quinella && payouts.quinella.length > 0) {
            payouts.quinella.forEach((p: any) => {
                refundsData.push({ type: "2PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout });
            });
        }
        // win -> WIN (単勝)
        const win = payouts.win && payouts.win[0];
        if (win) {
            refundsData.push({ type: "WIN", numbers: win.combination, amount: win.payout });
        }

        const savedResult = await prisma.raceResult.upsert({
            where: {
                placeName_raceNumber_raceDate: {
                    placeName,
                    raceNumber,
                    raceDate
                }
            },
            update: {
                firstPlace: first,
                secondPlace: second,
                thirdPlace: third,
                refunds: JSON.stringify(refundsData)
            },
            create: {
                placeName,
                raceNumber,
                raceDate,
                firstPlace: first,
                secondPlace: second,
                thirdPlace: third,
                refunds: JSON.stringify(refundsData)
            }
        });

        return { success: true, result: savedResult };
    } catch (e: any) {
        console.error("[API Error] Failed to fetch and save result:", e);
        return { success: false, error: e.message };
    }
}
