"use client";

import { useBetStore } from '@/store/bet-store';
import { BOAT_COLORS } from '@/lib/bet-logic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToggleAllButton } from './ToggleAllButton';

export function VerticalGrid() {
    const { activeBetType, selections, toggleSelection } = useBetStore();

    const cols = activeBetType.includes('3')
        ? (['first', 'second', 'third'] as const)
        : activeBetType === 'WIN'
            ? (['first'] as const)
            : (['first', 'second'] as const);
    return (
        <div className="flex flex-col gap-2 w-full max-w-sm">
            {/* Table Header */}
            <div className="flex w-full text-center text-sm font-bold bg-neutral-100 rounded-t-md">
                <div className="w-12 py-2 border-r border-neutral-300">枠番</div>
                {cols.map((col, idx) => (
                    <div key={col} className="flex-1 py-2">{idx + 1}着</div>
                ))}
            </div>

            {/* Grid Rows */}
            {BOAT_COLORS.map(({ no, colorCls }) => (
                <div key={no} className="flex w-full h-12">
                    {/* Boat Number Col */}
                    <div className={cn("w-12 flex items-center justify-center font-bold text-lg rounded-l-sm border", colorCls)}>
                        {no}
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
                                    "flex-1 border-t border-b border-r flex items-center justify-center cursor-pointer transition-colors duration-200",
                                    isSelected ? "bg-blue-100" : "bg-white hover:bg-neutral-50",
                                    isDisabled && "opacity-50 cursor-not-allowed bg-neutral-100 hover:bg-neutral-100"
                                )}
                                onClick={() => {
                                    if (!isDisabled) toggleSelection(col, no);
                                }}
                            >
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Toggle All Row */}
            <div className="flex w-full mt-2">
                <div className="w-12 flex items-center justify-center text-sm font-bold text-neutral-500">
                    選択
                </div>
                {cols.map((col) => (
                    <div key={`toggle-all-${col}`} className="flex-1 px-1">
                        <ToggleAllButton position={col} />
                    </div>
                ))}
            </div>
        </div>
    );
}
