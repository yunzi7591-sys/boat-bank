"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VenueStatsItem {
  placeName: string;
  venueId: string;
  totalInvestment: number;
  totalRefund: number;
  recoveryRate: number;
  hitCount: number;
  totalPredictions: number;
}

type RaceType = "morning" | "day" | "nighter" | "midnight";

interface VenueStatsGridProps {
  allTimeStats: VenueStatsItem[];
  yearStats: VenueStatsItem[];
  monthlyStats: { [key: string]: VenueStatsItem[] };
  byRaceType: { [K in RaceType]: VenueStatsItem[] };
}

type Period = "allTime" | "year" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
  allTime: "通算",
  year: "2026年",
  monthly: "月別",
};

type RaceTypeFilter = "all" | RaceType;

const RACE_TYPE_LABELS: Record<RaceTypeFilter, string> = {
  all: "全て",
  morning: "モーニング",
  day: "デイ",
  nighter: "ナイター",
  midnight: "ミッドナイト",
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function formatCurrency(value: number): string {
  return value.toLocaleString("ja-JP");
}

function getMonthKey(month: number): string {
  return `2026-${String(month).padStart(2, "0")}`;
}

export function VenueStatsGrid({
  allTimeStats,
  yearStats,
  monthlyStats,
  byRaceType,
}: VenueStatsGridProps) {
  const currentMonth = new Date().getMonth() + 1;
  const [period, setPeriod] = useState<Period>("allTime");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedVenue, setSelectedVenue] = useState<VenueStatsItem | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"recovery" | "profit">("recovery");
  const [raceTypeFilter, setRaceTypeFilter] = useState<RaceTypeFilter>("all");

  const stats: VenueStatsItem[] =
    raceTypeFilter !== "all"
      ? byRaceType[raceTypeFilter]
      : period === "allTime"
        ? allTimeStats
        : period === "year"
          ? yearStats
          : (monthlyStats[getMonthKey(selectedMonth)] ?? []);

  const periodLabel =
    raceTypeFilter !== "all"
      ? `通算 / ${RACE_TYPE_LABELS[raceTypeFilter]}`
      : period === "allTime"
        ? "通算"
        : period === "year"
          ? "2026年"
          : `2026年${selectedMonth}月`;

  function handleCellClick(item: VenueStatsItem) {
    setSelectedVenue(item);
    setDialogOpen(true);
  }

  return (
    <div className="w-full">
      {/* 開催形態フィルタ */}
      <div className="flex gap-1 mb-3 bg-[#f1f5f9] rounded-lg p-1">
        {(Object.keys(RACE_TYPE_LABELS) as RaceTypeFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRaceTypeFilter(key)}
            className={`flex-1 text-[10px] font-bold py-2 rounded-md transition-colors ${
              raceTypeFilter === key
                ? "bg-white text-[#061b31] shadow-sm"
                : "text-[#64748d] hover:text-[#061b31]"
            }`}
          >
            {RACE_TYPE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 期間切り替えタブ */}
      <div className={`flex gap-1 mb-3 bg-[#f1f5f9] rounded-lg p-1 ${raceTypeFilter !== "all" ? "opacity-40 pointer-events-none" : ""}`}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${
              period === key && raceTypeFilter === "all"
                ? "bg-white text-[#061b31] shadow-sm"
                : "text-[#64748d] hover:text-[#061b31]"
            }`}
          >
            {PERIOD_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 月セレクター */}
      {period === "monthly" && (
        <div className="flex flex-wrap gap-1 mb-3">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors ${
                selectedMonth === m
                  ? "bg-[#533afd] text-white"
                  : "bg-[#f1f5f9] text-[#64748d] hover:text-[#061b31]"
              }`}
            >
              {m}月
            </button>
          ))}
        </div>
      )}

      {/* 表示切替 */}
      <div className="flex gap-1 mb-3 bg-[#f1f5f9] rounded-md p-0.5 w-fit">
        <button onClick={() => setDisplayMode("recovery")} className={`text-[10px] font-bold px-2.5 py-1 rounded ${displayMode === "recovery" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}>
          回収率
        </button>
        <button onClick={() => setDisplayMode("profit")} className={`text-[10px] font-bold px-2.5 py-1 rounded ${displayMode === "profit" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}>
          利益
        </button>
      </div>

      {/* 全場合計 */}
      {(() => {
        const totalInv = stats.reduce((s, i) => s + i.totalInvestment, 0);
        const totalRef = stats.reduce((s, i) => s + i.totalRefund, 0);
        const totalProfit = totalRef - totalInv;
        const totalRate = totalInv > 0 ? (totalRef / totalInv) * 100 : 0;
        const totalRaces = stats.reduce((s, i) => s + i.totalPredictions, 0);
        return (
          <div className="bg-white border border-[#e5edf5] rounded-lg p-3 mb-3" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#061b31]">全場合計</span>
                <span className="text-[10px] text-[#64748d] ml-2">{totalRaces}R</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold tabular-nums ${totalRate >= 100 ? 'text-[#533afd]' : 'text-[#061b31]'}`}>
                  {totalInv > 0 ? `${totalRate.toFixed(1)}%` : '-%'}
                </span>
                <span className={`text-sm font-bold tabular-nums ${totalProfit >= 0 ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}円
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 24場グリッド */}
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((item) => {
          const hasData = item.totalPredictions > 0;
          const profit = item.totalRefund - item.totalInvestment;

          let valueText: string;
          let valueColor: string;

          if (displayMode === "recovery") {
            valueText = hasData ? `${item.recoveryRate.toFixed(1)}%` : "-%";
            valueColor = !hasData ? "text-[#64748d]" : item.recoveryRate >= 100 ? "text-[#533afd]" : "text-[#061b31]";
          } else {
            if (!hasData) {
              valueText = "-";
              valueColor = "text-[#64748d]";
            } else {
              valueText = `${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`;
              valueColor = profit >= 0 ? "text-[#533afd]" : "text-[#ea2261]";
            }
          }

          return (
            <button
              key={item.venueId}
              type="button"
              onClick={() => handleCellClick(item)}
              className="bg-white border border-[#e5edf5] rounded-lg p-2 text-center transition-colors hover:border-[#b9b9f9] active:bg-[#f8f7ff]"
            >
              <div className="text-[10px] font-bold text-[#061b31] truncate leading-tight">
                {item.placeName}
              </div>
              <div className={`text-sm font-black leading-tight mt-0.5 ${valueColor}`}>
                {valueText}
              </div>
            </button>
          );
        })}
      </div>

      {/* 詳細ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          {selectedVenue && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-[#061b31]">
                  {selectedVenue.placeName}
                </DialogTitle>
                <p className="text-xs text-[#64748d] font-bold">
                  {periodLabel}
                </p>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* 回収率（大きく表示） */}
                <div className="text-center">
                  <div className="text-xs font-bold text-[#64748d] mb-1">
                    回収率
                  </div>
                  <div
                    className={`text-4xl font-black ${
                      selectedVenue.totalPredictions === 0
                        ? "text-[#64748d]"
                        : selectedVenue.recoveryRate >= 100
                          ? "text-[#533afd]"
                          : "text-[#061b31]"
                    }`}
                  >
                    {selectedVenue.totalPredictions > 0
                      ? `${selectedVenue.recoveryRate.toFixed(1)}%`
                      : "-%"}
                  </div>
                </div>

                {/* 詳細数値 */}
                <div className="grid grid-cols-2 gap-2">
                  <DetailCell
                    label="投資額"
                    value={`¥${formatCurrency(selectedVenue.totalInvestment)}`}
                  />
                  <DetailCell
                    label="回収額"
                    value={`¥${formatCurrency(selectedVenue.totalRefund)}`}
                  />
                  <DetailCell
                    label="的中数"
                    value={`${selectedVenue.hitCount} / ${selectedVenue.totalPredictions}`}
                  />
                  <ProfitCell
                    label="収支"
                    value={
                      selectedVenue.totalRefund - selectedVenue.totalInvestment
                    }
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
      <div className="text-[10px] font-bold text-[#64748d] mb-0.5">
        {label}
      </div>
      <div className="text-sm font-black text-[#061b31]">{value}</div>
    </div>
  );
}

function ProfitCell({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  const display = `${isPositive ? "+" : ""}¥${formatCurrency(Math.abs(value))}`;

  return (
    <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
      <div className="text-[10px] font-bold text-[#64748d] mb-0.5">
        {label}
      </div>
      <div
        className={`text-sm font-black ${isPositive ? "text-[#533afd]" : "text-[#ea2261]"}`}
      >
        {display}
      </div>
    </div>
  );
}
