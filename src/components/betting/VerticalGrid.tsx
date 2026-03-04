"use client";

import { useBetStore } from '@/store/bet-store';
import { BOAT_COLORS } from '@/lib/bet-logic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToggleAllButton } from './ToggleAllButton';
import { motion } from 'framer-motion';

// Added Mock Types for Racer Info based on OpenAPI
export type MockRacer = {
    boat_number: number;
    racer_name: string;
    racer_class: string;
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
                <div className="w-24 sm:w-32 py-2 border-r border-slate-200">枠番 / 選手</div>
                {cols.map((col, idx) => (
                    <div key={col} className="flex-1 py-2 text-slate-600">{idx + 1}着</div>
                ))}
            </div>

            {/* Grid Rows */}
            {BOAT_COLORS.map(({ no, colorCls }) => {
                const racer = racers.find(r => r.boat_number === no);

                return (
                    <div key={no} className="flex w-full min-h-[52px]">
                        {/* Boat Number & Racer Col */}
                        <div className={cn(
                            "w-24 sm:w-32 flex flex-col justify-center px-1 py-1 rounded-l-md border shadow-sm relative overflow-hidden",
                            colorCls
                        )}>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className={cn(
                                    "font-black text-lg sm:text-xl w-5 sm:w-6 text-center leading-none",
                                    (no === 1 || no === 3 || no === 4 || no === 6) ? "text-slate-900" : "text-white"
                                )}>
                                    {no}
                                </span>
                                {racer && (
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={cn(
                                            "text-[10px] font-bold leading-tight px-1 rounded-sm w-fit bg-white/80",
                                            // Conditional styling for class
                                            racer.racer_class.includes('A1') ? "text-yellow-700" :
                                                racer.racer_class.includes('A2') ? "text-slate-700" :
                                                    racer.racer_class.includes('B1') ? "text-red-700" : "text-blue-700"
                                        )}>
                                            {racer.racer_class}
                                        </span>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-bold truncate mt-0.5",
                                            (no === 1 || no === 3 || no === 4 || no === 6) ? "text-slate-900" : "text-white"
                                        )}>
                                            {racer.racer_name.replace(/\s+/g, '')}
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
                                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20"
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        </motion.div>
                                    ) : (
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-slate-200"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Toggle All Row */}
            <div className="flex w-full mt-3">
                <div className="w-24 sm:w-32 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-400">
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
