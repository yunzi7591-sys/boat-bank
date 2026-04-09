"use client";

import { useState, useTransition } from "react";
import { CalendarPnL, DailyPnLItem, MonthlyPnLItem } from "./CalendarPnL";
import { fetchDailyStats } from "@/actions/stats";

interface CalendarPnLWrapperProps {
    userId: string;
    initialDailyStats: DailyPnLItem[];
    monthlyPnL: MonthlyPnLItem[];
    currentYear: number;
    currentMonth: number;
}

export function CalendarPnLWrapper({
    userId,
    initialDailyStats,
    monthlyPnL,
    currentYear,
    currentMonth,
}: CalendarPnLWrapperProps) {
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [dailyStats, setDailyStats] = useState<DailyPnLItem[]>(initialDailyStats);
    const [isPending, startTransition] = useTransition();

    const handleMonthChange = (newYear: number, newMonth: number) => {
        setYear(newYear);
        setMonth(newMonth);
        startTransition(async () => {
            const result = await fetchDailyStats(newYear, newMonth);
            if (result.success) {
                setDailyStats(result.data);
            }
        });
    };

    return (
        <div className={isPending ? "opacity-60 transition-opacity" : ""}>
            <CalendarPnL
                dailyStats={dailyStats}
                monthlyPnL={monthlyPnL}
                currentYear={year}
                currentMonth={month}
                onMonthChange={handleMonthChange}
            />
        </div>
    );
}
