"use server";

import { prisma } from "@/lib/prisma";
import { VENUES } from "@/lib/constants/venues";

export async function getRaceEntriesAndSchedule(stadiumId: string, raceNumber: number) {
    try {
        const venue = VENUES.find(v => v.id === stadiumId);
        if (!venue) {
            return { success: false, error: "Invalid venue ID" };
        }

        const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
        const currentDate = new Date(todayStr);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const searchDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

        const schedule = await prisma.raceSchedule.findUnique({
            where: {
                placeName_raceNumber_raceDate: {
                    placeName: venue.name,
                    raceNumber: raceNumber,
                    raceDate: searchDate
                }
            }
        });

        const entries = await prisma.raceEntry.findMany({
            where: {
                placeName: venue.name,
                raceNumber: raceNumber,
                raceDate: searchDate
            },
            include: {
                racer: true
            },
            orderBy: {
                boatNumber: 'asc'
            }
        });

        return { success: true, venue, schedule, entries };
    } catch (e: any) {
        console.error("Error fetching race details:", e);
        return { success: false, error: e.message };
    }
}
