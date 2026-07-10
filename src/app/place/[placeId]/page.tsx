import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, MapPin, PenTool, Lock, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BOAT_COLORS } from "@/lib/bet-logic";

import { RaceHubClient } from "./RaceHubClient";

export async function generateMetadata(props: { params: Promise<{ placeId: string }> }) {
    const params = await props.params;
    const venue = VENUES.find(v => v.id === params.placeId);
    if (!venue) return { title: "会場が見つかりません | BOAT BANK" };
    return {
        title: `${venue.name}競艇 今日の予想・レース情報・締切時刻 | BOAT BANK`,
        description: `ボートレース${venue.name}の本日のレース一覧・締切時刻・選手データ・結果と公開予想を毎日更新。無料予想もチェックできます。`,
        alternates: { canonical: `https://boatbank.jp/place/${venue.id}` },
    };
}

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

    const raceDateFilter = new Date(`${localDateStr}T00:00:00.000Z`);

    // Fetch all data in parallel
    const [schedules, allMarketPredictions, allRaceResults, allRaceEntries, activeEvent] = await Promise.all([
        prisma.raceSchedule.findMany({
            where: { placeName: venue.name, raceDate: raceDateFilter },
            orderBy: { raceNumber: 'asc' }
        }),
        prisma.prediction.findMany({
            where: { placeName: venue.name, raceDate: raceDateFilter, isPrivate: false },
            include: {
                author: { select: { name: true, image: true, role: true } },
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.raceResult.findMany({
            where: { placeName: venue.name, raceDate: raceDateFilter }
        }),
        prisma.raceEntry.findMany({
            where: { placeName: venue.name, raceDate: raceDateFilter },
            select: {
                boatNumber: true,
                raceNumber: true,
                localWinRate: true,
                motorRate: true,
                isAbsent: true,
                racer: { select: { name: true, grade: true } },
            },
            orderBy: { boatNumber: 'asc' }
        }),
        prisma.event.findFirst({
            where: { isActive: true, placeName: venue.name },
            select: { id: true, name: true, placeName: true },
        }),
    ]);

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

    // 一覧に見解本文・買い目は不要なため送らない（見解の有無だけ hasCommentary で渡す）
    const timelinePredictions = allMarketPredictions.map(p => {
        const { commentary, analysisComment, predictedNumbers, ...rest } = p;
        return { ...rest, hasCommentary: !!commentary?.trim() };
    });

    return (
        <RaceHubClient
            venue={venue}
            schedules={schedules}
            allMarketPredictions={timelinePredictions}
            allRaceResults={allRaceResults}
            allRaceEntries={allRaceEntries}
            initialActiveRace={activeRaceNumber}
            activeEvent={activeEvent}
        />
    );
}
