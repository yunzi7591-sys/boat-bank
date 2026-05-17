"use client";

import { useBetStore } from '@/store/bet-store';
import { BoatSelection } from '@/lib/bet-logic';
import { Button } from '@/components/ui/button';

export function ToggleAllButton({ position }: { position: keyof BoatSelection }) {
    const { toggleAll, selections } = useBetStore();

    const allBoats = [1, 2, 3, 4, 5, 6];
    const current = selections[position];
    const isAllSelected = allBoats.every((n) => current.includes(n));

    return (
        <Button
            variant={isAllSelected ? "default" : "outline"}
            className="w-full text-xs h-8 px-0"
            onClick={() => toggleAll(position, [])}
        >
            全
        </Button>
    );
}
