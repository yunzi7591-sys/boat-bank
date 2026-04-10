import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, MapPin, PenTool, Lock, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BOAT_COLORS } from "@/lib/bet-logic";

import { RaceHubClient } from "./RaceHubClient";

export default async function PlacePage(props: {
    params: Promise<{ placeId: string }>;
    searchParams: Promise<{ race?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    const venue = VENUES.find(v => v.id === params.placeId);

    if (!venue) {
        return <div className="p-8 text-center text-red-500 font-bold">会場が見つかりません</div>;
    }

    const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
    const currentDate = new Date(todayStr);
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const localDateStr = `${yyyy}-${mm}-${dd}`;

    // Fetch all schedules for today for this venue
    const schedules = await prisma.raceSchedule.findMany({
        where: {
            placeName: venue.name,
            raceDate: new Date(`${localDateStr}T00:00:00.000Z`)
        },
        orderBy: { raceNumber: 'asc' }
    });

    // Fetch all public predictions for today for this venue
    const allMarketPredictions = await prisma.prediction.findMany({
        where: {
            placeName: venue.name,
            raceDate: new Date(`${localDateStr}T00:00:00.000Z`),
            isPrivate: false,
        },
        include: {
            author: { select: { name: true, image: true } },
            _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } },
        },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch all Race Results for today for this venue
    const allRaceResults = await prisma.raceResult.findMany({
        where: {
            placeName: venue.name,
            raceDate: new Date(`${localDateStr}T00:00:00.000Z`)
        }
    });

    // Fetch all Race Entries (with Racers) for today for this venue
    const allRaceEntries = await prisma.raceEntry.findMany({
        where: {
            placeName: venue.name,
            raceDate: new Date(`${localDateStr}T00:00:00.000Z`)
        },
        include: {
            racer: true
        },
        orderBy: {
            boatNumber: 'asc'
        }
    });

    // 最も締切が近い未終了レースを自動選択（サーバータイム基準）
    let activeRaceNumber = 1;
    if (searchParams.race) {
        activeRaceNumber = parseInt(searchParams.race);
    } else {
        const now = new Date();
        const upcomingRaces = schedules
            .filter(s => new Date(s.deadlineAt) > now)
            .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
        activeRaceNumber = upcomingRaces.length > 0 ? upcomingRaces[0].raceNumber : 1;
    }

    return (
        <RaceHubClient
            venue={venue}
            schedules={schedules}
            allMarketPredictions={allMarketPredictions}
            allRaceResults={allRaceResults}
            allRaceEntries={allRaceEntries}
            initialActiveRace={activeRaceNumber}
        />
    );
}
