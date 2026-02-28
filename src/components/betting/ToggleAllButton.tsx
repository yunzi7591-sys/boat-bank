"use client";

import { useBetStore } from '@/store/bet-store';
import { BoatSelection } from '@/lib/bet-logic';
import { Button } from '@/components/ui/button';

export function ToggleAllButton({ position }: { position: keyof BoatSelection }) {
    const { toggleAll, selections, activeBetType } = useBetStore();

    // Find disabled numbers
    let excludeNumbers: number[] = [];
    const isExactaOrTrifecta = activeBetType === '3TR' || activeBetType === '2TR';

    if (isExactaOrTrifecta) {
        const allCols: (keyof BoatSelection)[] = ['first', 'second', 'third'];
        const otherCols = allCols.filter(c => c !== position);
        otherCols.forEach(col => {
            excludeNumbers = [...excludeNumbers, ...selections[col]];
        });
    }

    // Check if all available choices are selected
    const allBoats = [1, 2, 3, 4, 5, 6];
    const targetBoats = allBoats.filter((n) => !excludeNumbers.includes(n));
    const current = selections[position];
    const isAllSelected = targetBoats.length > 0 && targetBoats.every((n) => current.includes(n));

    return (
        <Button
            variant={isAllSelected ? "default" : "outline"}
            className="w-full text-xs h-8 px-0"
            onClick={() => toggleAll(position, excludeNumbers)}
            disabled={targetBoats.length === 0}
        >
            全
        </Button>
    );
}
