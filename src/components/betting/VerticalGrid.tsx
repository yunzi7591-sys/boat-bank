"use client";

import { useBetStore } from '@/store/bet-store';
import { BOAT_COLORS } from '@/lib/bet-logic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToggleAllButton } from './ToggleAllButton';
import { motion } from 'framer-motion';

// Updated Mock Types based on user's new request
export type MockRacer = {
    boatNumber: number;
    name: string;
    class: string;
    color: string;
};

interface VerticalGridProps {
    racers?: MockRacer[];
}

export function VerticalGrid({ racers = [] }: VerticalGridProps) {
    const { activeBetType, selections, toggleSelection } = useBetStore();

    const cols = activeBetType.includes('3')
        ? (['first', 'second', 'third'] as const)
        : activeBetType === 'WIN'
            ? (['first'] as const)
            : (['first', 'second'] as const);

    return (
        <div className="flex flex-col gap-2 w-full max-w-lg">
            {/* Table Header */}
            <div className="flex w-full text-center text-sm font-bold bg-slate-100 rounded-t-lg shadow-inner">
                {/* Expanded Width for Racer Name */}
                <div className="w-[120px] sm:w-[150px] py-2 border-r border-slate-200">枠番 / 選手</div>
                {cols.map((col, idx) => (
                    <div key={col} className="flex-1 py-2 text-slate-600">{idx + 1}着</div>
                ))}
            </div>

            {/* Grid Rows */}
            {BOAT_COLORS.map(({ no, colorCls }) => {
                const racer = racers.find(r => r.boatNumber === no);

                return (
                    <div key={no} className="flex w-full min-h-[56px]">
                        {/* Boat Number & Racer Col */}
                        <div className={cn(
                            "w-[120px] sm:w-[150px] flex flex-col justify-center px-1.5 py-1 rounded-l-md border shadow-sm relative overflow-hidden",
                            racer ? racer.color : colorCls
                        )}>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className={cn(
                                    "font-black text-xl sm:text-2xl w-6 sm:w-8 text-center leading-none"
                                )}>
                                    {no}
                                </span>
                                {racer && (
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                        <span className={cn(
                                            "text-[10px] font-bold leading-tight px-1 rounded-sm w-fit",
                                            // Conditional styling for class
                                            racer.class.includes('A1') ? "bg-yellow-100 text-yellow-800" :
                                                racer.class.includes('A2') ? "bg-slate-200 text-slate-800" :
                                                    racer.class.includes('B1') ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                        )}>
                                            {racer.class}
                                        </span>
                                        <span className="text-[13px] sm:text-[15px] font-bold truncate mt-0.5 tracking-tight leading-none">
                                            {racer.name.replace(/\s+/g, '')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selection Cols */}
                        {cols.map((col) => {
                            const isSelected = selections[col].includes(no);

                            // Disable if selected in another column (only for Exacta/Trifecta types)
                            const isExactaOrTrifecta = activeBetType === '3TR' || activeBetType === '2TR';
                            let isDisabled = false;
                            if (isExactaOrTrifecta && !isSelected) {
                                const otherCols = cols.filter(c => c !== col);
                                isDisabled = otherCols.some(c => selections[c].includes(no));
                            }

                            return (
                                <div
                                    key={`${col}-${no}`}
                                    className={cn(
                                        "flex-1 border-t border-b border-r flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm",
                                        isSelected
                                            ? "bg-blue-50/80 hover:bg-blue-100"
                                            : "bg-white hover:bg-slate-50",
                                        isDisabled && "opacity-40 cursor-not-allowed bg-slate-50 hover:bg-slate-50"
                                    )}
                                    onClick={() => {
                                        if (!isDisabled) toggleSelection(col, no);
                                    }}
                                >
                                    {isSelected ? (
                                        <motion.div
                                            layoutId={`check-${col}-${no}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20"
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        </motion.div>
                                    ) : (
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-200"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Toggle All Row */}
            <div className="flex w-full mt-3">
                <div className="w-[120px] sm:w-[150px] flex items-center justify-center text-[11px] sm:text-xs font-bold text-slate-400">
                    一括選択
                </div>
                {cols.map((col) => (
                    <div key={`toggle-all-${col}`} className="flex-1 px-1 flex justify-center">
                        <ToggleAllButton position={col} />
                    </div>
                ))}
            </div>
        </div>
    );
}
