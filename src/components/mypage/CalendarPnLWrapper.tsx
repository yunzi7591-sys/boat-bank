"use client";

import { useState, useTransition } from "react";
import { CalendarPnL, DailyPnLItem, DailyPredictionItem } from "./CalendarPnL";
import { fetchDailyStats } from "@/actions/stats";

interface CalendarPnLWrapperProps {
    userId: string;
    initialDailyStats: DailyPnLItem[];
    initialDailyPredictions: { [date: string]: DailyPredictionItem[] };
    currentYear: number;
    currentMonth: number;
}

export function CalendarPnLWrapper({
    userId,
    initialDailyStats,
    initialDailyPredictions,
    currentYear,
    currentMonth,
}: CalendarPnLWrapperProps) {
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [dailyStats, setDailyStats] = useState<DailyPnLItem[]>(initialDailyStats);
    const [dailyPredictions, setDailyPredictions] = useState<{ [date: string]: DailyPredictionItem[] }>(initialDailyPredictions);
    const [isPending, startTransition] = useTransition();

    const handleMonthChange = (newYear: number, newMonth: number) => {
        setYear(newYear);
        setMonth(newMonth);
        startTransition(async () => {
            const result = await fetchDailyStats(newYear, newMonth);
            if (result.success) {
                setDailyStats(result.data);
                setDailyPredictions(result.dailyPredictions);
            }
        });
    };

    return (
        <div className={isPending ? "opacity-60 transition-opacity" : ""}>
            <CalendarPnL
                dailyStats={dailyStats}
                dailyPredictions={dailyPredictions}
                currentYear={year}
                currentMonth={month}
                onMonthChange={handleMonthChange}
            />
        </div>
    );
}
