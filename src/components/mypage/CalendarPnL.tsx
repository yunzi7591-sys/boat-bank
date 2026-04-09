"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyPnLItem {
  date: string; // "2026-04-01"
  investment: number;
  refund: number;
  pnl: number; // refund - investment
  predictions: number;
}

interface MonthlyPnLItem {
  month: string; // "2026-01"
  investment: number;
  refund: number;
  pnl: number;
  predictions: number;
}

interface CalendarPnLProps {
  dailyStats: DailyPnLItem[];
  monthlyPnL: MonthlyPnLItem[];
  currentYear: number;
  currentMonth: number; // 1-12
  onMonthChange?: (year: number, month: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function formatCurrency(value: number): string {
  return value.toLocaleString("ja-JP");
}

function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000) {
    const man = Math.round(abs / 1000) / 10;
    return `${value < 0 ? "-" : "+"}${man}万`;
  }
  return `${value < 0 ? "-" : "+"}¥${formatCurrency(abs)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Build calendar grid: 6 weeks x 7 days */
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Start from the Sunday of the week containing the 1st
  const startDate = new Date(year, month - 1, 1 - startDow);

  const days: { date: Date; inMonth: boolean }[] = [];
  // Always show enough rows to cover the month (max 6 weeks)
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      date: d,
      inMonth: d.getMonth() === month - 1 && d.getFullYear() === year,
    });
  }

  return days;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MonthHeader({
  year,
  month,
  onMonthChange,
}: {
  year: number;
  month: number;
  onMonthChange?: (year: number, month: number) => void;
}) {
  function handlePrev() {
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    onMonthChange?.(prev.y, prev.m);
  }

  function handleNext() {
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    onMonthChange?.(next.y, next.m);
  }

  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <button
        type="button"
        onClick={handlePrev}
        className="p-1.5 rounded-md text-[#64748d] hover:text-[#061b31] hover:bg-[#f1f5f9] transition-colors"
        aria-label="前月"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-[#061b31]">
        {year}年{month}月
      </span>
      <button
        type="button"
        onClick={handleNext}
        className="p-1.5 rounded-md text-[#64748d] hover:text-[#061b31] hover:bg-[#f1f5f9] transition-colors"
        aria-label="翌月"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function CalendarGrid({
  year,
  month,
  dailyMap,
}: {
  year: number;
  month: number;
  dailyMap: Map<string, DailyPnLItem>;
}) {
  const today = new Date();
  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  return (
    <div>
      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-[10px] font-bold py-1 ${
              i === 0 ? "text-[#ea2261]" : i === 6 ? "text-[#533afd]" : "text-[#64748d]"
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {days.map(({ date, inMonth }) => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const stat = dailyMap.get(key);
          const isToday = isSameDay(date, today);
          const dow = date.getDay();

          return (
            <div
              key={key}
              className={`
                relative flex flex-col items-center py-1.5 min-h-[48px] rounded-md text-center
                ${isToday ? "border-2 border-[#533afd]" : "border border-transparent"}
                ${!inMonth ? "opacity-30" : ""}
              `}
            >
              <span
                className={`text-[11px] font-bold leading-none ${
                  !inMonth
                    ? "text-[#c0c8d4]"
                    : dow === 0
                      ? "text-[#ea2261]"
                      : dow === 6
                        ? "text-[#533afd]"
                        : "text-[#061b31]"
                }`}
              >
                {date.getDate()}
              </span>
              {stat && inMonth && (
                <span
                  className={`text-[9px] font-black leading-tight mt-0.5 ${
                    stat.pnl > 0
                      ? "text-[#533afd]"
                      : stat.pnl < 0
                        ? "text-[#ea2261]"
                        : "text-[#64748d]"
                  }`}
                >
                  {formatCompactCurrency(stat.pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlySummary({
  dailyStats,
}: {
  dailyStats: DailyPnLItem[];
}) {
  const totals = useMemo(() => {
    let investment = 0;
    let refund = 0;
    let predictions = 0;
    for (const d of dailyStats) {
      investment += d.investment;
      refund += d.refund;
      predictions += d.predictions;
    }
    return { investment, refund, pnl: refund - investment, predictions };
  }, [dailyStats]);

  return (
    <div className="mt-4 bg-[#f8fafc] rounded-lg p-3">
      <div className="text-[10px] font-bold text-[#64748d] mb-2">月間サマリー</div>
      <div className="grid grid-cols-2 gap-2">
        <SummaryCell label="投資額" value={`¥${formatCurrency(totals.investment)}`} />
        <SummaryCell label="回収額" value={`¥${formatCurrency(totals.refund)}`} />
        <div className="bg-white rounded-lg p-2.5 text-center">
          <div className="text-[10px] font-bold text-[#64748d] mb-0.5">収支</div>
          <div
            className={`text-sm font-black ${
              totals.pnl > 0
                ? "text-[#533afd]"
                : totals.pnl < 0
                  ? "text-[#ea2261]"
                  : "text-[#64748d]"
            }`}
          >
            {totals.pnl >= 0 ? "+" : ""}¥{formatCurrency(Math.abs(totals.pnl))}
          </div>
        </div>
        <SummaryCell label="予想数" value={`${totals.predictions}件`} />
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 text-center">
      <div className="text-[10px] font-bold text-[#64748d] mb-0.5">{label}</div>
      <div className="text-sm font-black text-[#061b31]">{value}</div>
    </div>
  );
}

function YearlySummary({
  monthlyPnL,
  currentYear,
}: {
  monthlyPnL: MonthlyPnLItem[];
  currentYear: number;
}) {
  // Build a map for quick lookup
  const monthMap = useMemo(() => {
    const m = new Map<string, MonthlyPnLItem>();
    for (const item of monthlyPnL) {
      m.set(item.month, item);
    }
    return m;
  }, [monthlyPnL]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold text-[#64748d] mb-2">
        {currentYear}年 月別収支
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {months.map((m) => {
          const key = `${currentYear}-${String(m).padStart(2, "0")}`;
          const item = monthMap.get(key);
          const pnl = item?.pnl ?? 0;
          const hasPredictions = (item?.predictions ?? 0) > 0;

          return (
            <div
              key={m}
              className="bg-white border border-[#e5edf5] rounded-lg p-2 text-center"
            >
              <div className="text-[10px] font-bold text-[#64748d]">{m}月</div>
              <div
                className={`text-xs font-black mt-0.5 ${
                  !hasPredictions
                    ? "text-[#c0c8d4]"
                    : pnl > 0
                      ? "text-[#533afd]"
                      : pnl < 0
                        ? "text-[#ea2261]"
                        : "text-[#64748d]"
                }`}
              >
                {hasPredictions
                  ? `${pnl >= 0 ? "+" : ""}¥${formatCurrency(Math.abs(pnl))}`
                  : "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CalendarPnL({
  dailyStats,
  monthlyPnL,
  currentYear,
  currentMonth,
  onMonthChange,
}: CalendarPnLProps) {
  const dailyMap = useMemo(() => {
    const m = new Map<string, DailyPnLItem>();
    for (const item of dailyStats) {
      m.set(item.date, item);
    }
    return m;
  }, [dailyStats]);

  return (
    <div className="bg-white border border-[#e5edf5] rounded-lg p-4">
      <MonthHeader
        year={currentYear}
        month={currentMonth}
        onMonthChange={onMonthChange}
      />

      <CalendarGrid
        year={currentYear}
        month={currentMonth}
        dailyMap={dailyMap}
      />

      <MonthlySummary dailyStats={dailyStats} />

      <YearlySummary
        monthlyPnL={monthlyPnL}
        currentYear={currentYear}
      />
    </div>
  );
}

export type { CalendarPnLProps, DailyPnLItem, MonthlyPnLItem };
