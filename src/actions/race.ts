"use server";

import { prisma } from "@/lib/prisma";
import { VENUES } from "@/lib/constants/venues";
import { jstBusinessRaceDate } from "@/lib/business-day";

export async function getRaceEntriesAndSchedule(stadiumId: string, raceNumber: number) {
    try {
        const venue = VENUES.find(v => v.id === stadiumId);
        if (!venue) {
            return { success: false, error: "Invalid venue ID" };
        }

        // 深夜2時(26時)までは前日扱い
        const searchDate = jstBusinessRaceDate();

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
