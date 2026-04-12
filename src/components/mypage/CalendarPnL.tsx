"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { deleteBets } from "@/actions/bet";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyPnLItem {
  date: string; // "2026-04-01"
  investment: number;
  refund: number;
  pnl: number; // refund - investment
  predictions: number;
}

interface DailyPredictionItem {
  id: string;
  source: 'prediction' | 'userbet';
  placeName: string;
  raceNumber: number;
  betType?: string;
  combination?: string;
  betAmount: number;
  hitAmount: number;
  refundAmount?: number;
  isSettled: boolean;
  isHit: boolean;
}

const BET_TYPE_LABELS: Record<string, string> = {
  '3TR': '3連単',
  '3PL': '3連複',
  '2TR': '2連単',
  '2PL': '2連複',
  'WIN': '単勝',
};

interface RaceGroup {
  key: string;
  placeName: string;
  raceNumber: number;
  items: DailyPredictionItem[];
  totalBet: number;
  totalHit: number;
  pnl: number;
  allSettled: boolean;
  anyHit: boolean;
  anyRefund: boolean;
}

interface CalendarPnLProps {
  dailyStats: DailyPnLItem[];
  dailyPredictions: { [date: string]: DailyPredictionItem[] };
  currentYear: number;
  currentMonth: number; // 1-12
  onMonthChange?: (year: number, month: number) => void;
  onRefresh?: () => void;
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

/** Build calendar grid: enough weeks to cover the month */
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const startDate = new Date(year, month - 1, 1 - startDow);

  const days: { date: Date; inMonth: boolean }[] = [];
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
  selectedDate,
  onDateClick,
}: {
  year: number;
  month: number;
  dailyMap: Map<string, DailyPnLItem>;
  selectedDate: string | null;
  onDateClick: (dateKey: string) => void;
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
          const isSelected = selectedDate === key;
          const dow = date.getDay();

          return (
            <button
              type="button"
              key={key}
              onClick={() => {
                if (inMonth) onDateClick(key);
              }}
              className={`
                relative flex flex-col items-center py-1.5 min-h-[48px] rounded-md text-center transition-colors
                ${isSelected ? "bg-[#533afd]/10 border-2 border-[#533afd]" : isToday ? "border-2 border-[#533afd]" : "border border-transparent"}
                ${!inMonth ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-[#f1f5f9]"}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

function groupByRace(predictions: DailyPredictionItem[]): RaceGroup[] {
  const map = new Map<string, DailyPredictionItem[]>();
  for (const p of predictions) {
    const key = `${p.placeName}-${p.raceNumber}`;
    const arr = map.get(key) || [];
    arr.push(p);
    map.set(key, arr);
  }

  return Array.from(map.entries()).map(([key, items]) => {
    const totalBet = items.reduce((s, i) => s + i.betAmount, 0);
    const totalHit = items.reduce((s, i) => s + i.hitAmount + (i.refundAmount || 0), 0);
    const allSettled = items.every((i) => i.isSettled);
    const anyHit = items.some((i) => i.isHit);
    const anyRefund = items.some((i) => i.isSettled && !i.isHit && (i.refundAmount || 0) > 0);
    return {
      key,
      placeName: items[0].placeName,
      raceNumber: items[0].raceNumber,
      items,
      totalBet,
      totalHit,
      pnl: totalHit - totalBet,
      allSettled,
      anyHit,
      anyRefund,
    };
  });
}

function getRaceStyle(group: RaceGroup): { textColor: string; label: string } {
  if (!group.allSettled) return { textColor: "text-[#94a3b8]", label: "結果待ち" };
  if (group.anyHit) return { textColor: "text-[#533afd]", label: "的中" };
  if (group.anyRefund) return { textColor: "text-[#ca8a04]", label: "返還" };
  return { textColor: "text-[#94a3b8]", label: "" };
}

function getItemStyle(p: DailyPredictionItem): { textColor: string; label: string } {
  const isRefund = p.isSettled && !p.isHit && (p.refundAmount || 0) > 0;
  if (!p.isSettled) return { textColor: "text-[#94a3b8]", label: "結果待ち" };
  if (p.isHit) return { textColor: "text-[#533afd]", label: "的中" };
  if (isRefund) return { textColor: "text-[#ca8a04]", label: "返還" };
  return { textColor: "text-[#94a3b8]", label: "" };
}

function DailyDetail({
  dateKey,
  month,
  predictions,
  onDeleteBets,
}: {
  dateKey: string;
  month: number;
  predictions: DailyPredictionItem[];
  onDeleteBets?: (betIds: string[]) => void;
}) {
  const day = parseInt(dateKey.split("-")[2], 10);
  const [expandedRace, setExpandedRace] = useState<string | null>(null);

  const raceGroups = useMemo(() => groupByRace(predictions), [predictions]);

  if (predictions.length === 0) {
    return (
      <div className="mt-3 bg-[#f8fafc] rounded-lg p-4 text-center text-sm text-[#64748d]">
        {month}月{day}日 — この日の予想はありません
      </div>
    );
  }

  const total = predictions.reduce((sum, p) => {
    if (!p.isSettled) return sum;
    return sum + (p.hitAmount + (p.refundAmount || 0) - p.betAmount);
  }, 0);

  return (
    <div className="mt-3 bg-[#f8fafc] rounded-lg p-4">
      <div className="text-xs font-bold text-[#061b31] mb-2">
        {month}月{day}日の結果
      </div>
      <div className="border-t border-[#e5edf5]" />

      <div className="mt-2 space-y-0.5">
        {raceGroups.map((group) => {
          const { textColor, label } = getRaceStyle(group);
          const isExpanded = expandedRace === group.key;

          const deletableIds = group.items.filter(p => p.source === "userbet").map(p => p.id);
          const canDelete = deletableIds.length > 0 && onDeleteBets;

          return (
            <div key={group.key}>
              {/* Race row */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setExpandedRace(isExpanded ? null : group.key)}
                  className="flex-1 flex items-center justify-between text-xs py-1.5 px-1 rounded hover:bg-[#e5edf5]/50 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <ChevronDown
                      className={`w-3 h-3 text-[#94a3b8] transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                    <span className={`font-bold ${textColor}`}>
                      {group.placeName} {group.raceNumber}R
                    </span>
                  </span>
                  <span className={`font-bold ${textColor}`}>
                    {!group.allSettled ? (
                      <span className="text-[10px] text-[#94a3b8]">結果待ち</span>
                    ) : (
                      <>
                        {group.pnl >= 0 ? "+" : ""}{formatCurrency(group.pnl)}円
                        {label && <span className="ml-1.5 text-[10px]">{label}</span>}
                      </>
                    )}
                  </span>
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDeleteBets(deletableIds)}
                    className="p-1 rounded hover:bg-[#ea2261]/10 text-[#ea2261]/40 hover:text-[#ea2261] transition-colors ml-1 shrink-0"
                    aria-label="このレースの賭けを削除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Expanded: individual bets */}
              {isExpanded && (
                <div className="ml-4 mb-1.5 space-y-1 border-l-2 border-[#e5edf5] pl-2.5">
                  {group.items.map((p, i) => {
                    const itemStyle = getItemStyle(p);
                    const betLabel = p.betType ? (BET_TYPE_LABELS[p.betType] || p.betType) : "";
                    const combo = p.combination || "";
                    const arrow = p.isSettled ? ` → ${formatCurrency(p.hitAmount + (p.refundAmount || 0))}円` : "";
                    const isLast = i === group.items.length - 1;
                    const connector = isLast ? "└" : "├";

                    return (
                      <div
                        key={p.id}
                        className="flex items-center text-[11px]"
                      >
                        <span className={`${itemStyle.textColor} flex items-center gap-1`}>
                          <span className="text-[#c0c8d4] font-mono text-[10px] w-3 shrink-0">{connector}</span>
                          {betLabel && <span className="font-bold">{betLabel}</span>}
                          {combo && <span>{combo}</span>}
                          <span className="text-[#64748d]">
                            {formatCurrency(p.betAmount)}円{arrow}
                          </span>
                          {itemStyle.label && (
                            <span className={`font-bold ${itemStyle.textColor} text-[10px]`}>
                              {itemStyle.label}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#e5edf5] mt-2 pt-2">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-[#061b31]">合計</span>
          <span
            className={
              total > 0
                ? "text-[#533afd]"
                : total < 0
                  ? "text-[#ea2261]"
                  : "text-[#64748d]"
            }
          >
            {total >= 0 ? "+" : ""}{formatCurrency(total)}円
          </span>
        </div>
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
    <div className="mb-4 bg-[#f1f5f9] rounded-lg p-3">
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
        <div className="bg-white rounded-lg p-2.5 text-center">
          <div className="text-[10px] font-bold text-[#64748d] mb-0.5">回収率</div>
          <div className={`text-sm font-black ${totals.investment > 0 && (totals.refund / totals.investment) >= 1 ? "text-[#533afd]" : "text-[#061b31]"}`}>
            {totals.investment > 0 ? ((totals.refund / totals.investment) * 100).toFixed(1) : "0.0"}%
          </div>
        </div>
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

// ─── PnL Chart ──────────────────────────────────────────────────────────────

function PnLChart({ dailyStats }: { dailyStats: DailyPnLItem[] }) {
  const sorted = useMemo(() =>
    [...dailyStats].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyStats]
  );

  if (sorted.length < 2) return null;

  let cumulative = 0;
  const points = sorted.map(d => {
    cumulative += d.pnl;
    const md = new Date(d.date);
    return { label: `${md.getMonth() + 1}/${md.getDate()}`, value: cumulative };
  });

  const W = 320;
  const H = 120;
  const PAD = { top: 8, right: 8, bottom: 20, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const values = [0, ...points.map(p => p.value)];
  const yMax = Math.max(...values);
  const yMin = Math.min(...values);
  const yRange = yMax - yMin || 1;
  const toX = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - yMin) / yRange) * chartH;
  const zeroY = toY(0);
  const linePoints = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');
  const fillPoints = `${toX(0)},${zeroY} ${linePoints} ${toX(points.length - 1)},${zeroY}`;
  const lastVal = points[points.length - 1]?.value || 0;
  const isPositive = lastVal >= 0;

  return (
    <div className="mt-4 pt-3 border-t border-[#e5edf5]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-[#64748d]">収益推移</span>
        <span className={`text-xs font-bold ${isPositive ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
          {isPositive ? '+' : ''}{lastVal.toLocaleString()}円
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#e5edf5" strokeWidth="1" strokeDasharray="4 2" />
        <polygon points={fillPoints} fill={isPositive ? 'rgba(83,58,253,0.08)' : 'rgba(234,34,97,0.08)'} />
        <polyline points={linePoints} fill="none" stroke={isPositive ? '#533afd' : '#ea2261'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.value)} r="3" fill="white" stroke={p.value >= 0 ? '#533afd' : '#ea2261'} strokeWidth="1.5" />
        ))}
        {points.map((p, i) => (
          <text key={`l${i}`} x={toX(i)} y={H - 3} textAnchor="middle" fontSize="7" fill="#94a3b8">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CalendarPnL({
  dailyStats,
  dailyPredictions,
  currentYear,
  currentMonth,
  onMonthChange,
  onRefresh,
}: CalendarPnLProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const dailyMap = useMemo(() => {
    const m = new Map<string, DailyPnLItem>();
    for (const item of dailyStats) {
      m.set(item.date, item);
    }
    return m;
  }, [dailyStats]);

  // deletedIdsでフィルタした予想データ
  const filteredPredictions = useMemo(() => {
    const result: { [date: string]: DailyPredictionItem[] } = {};
    for (const [date, items] of Object.entries(dailyPredictions)) {
      result[date] = items.filter(p => !deletedIds.has(p.id));
    }
    return result;
  }, [dailyPredictions, deletedIds]);

  function handleDateClick(dateKey: string) {
    setSelectedDate((prev) => (prev === dateKey ? null : dateKey));
  }

  function handleDeleteBets(betIds: string[]) {
    // 即座にUIから消す
    setDeletedIds(prev => {
      const next = new Set(prev);
      betIds.forEach(id => next.add(id));
      return next;
    });
    // バックグラウンドでサーバー一括削除
    deleteBets(betIds).then(() => onRefresh?.());
  }

  return (
    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 shadow-[0_4px_16px_rgba(50,50,93,0.1)]">
      <MonthHeader
        year={currentYear}
        month={currentMonth}
        onMonthChange={onMonthChange}
      />

      <MonthlySummary dailyStats={dailyStats} />

      <CalendarGrid
        year={currentYear}
        month={currentMonth}
        dailyMap={dailyMap}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />

      {selectedDate && (
        <DailyDetail
          dateKey={selectedDate}
          month={currentMonth}
          predictions={filteredPredictions[selectedDate] ?? []}
          onDeleteBets={handleDeleteBets}
        />
      )}

      {/* 収益推移グラフ */}
      <PnLChart dailyStats={dailyStats} />
    </div>
  );
}

export type { CalendarPnLProps, DailyPnLItem, DailyPredictionItem };
