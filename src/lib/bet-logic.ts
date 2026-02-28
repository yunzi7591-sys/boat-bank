// Boat racing bet combination generation and validation logic

export type BetType = '3TR' | '3PL' | '2TR' | '2PL' | 'WIN'; // 3連単, 3連複, 2連単, 2連複, 単勝

export interface BoatSelection {
    first: number[];
    second: number[];
    third: number[];
}

export interface Combination {
    id: string; // e.g., "1-2-3"
    numbers: number[]; // e.g., [1, 2, 3]
    amount: number;
}

export interface Formation {
    id: string; // unique ID for the formation block in cart
    betType: BetType;
    selections: BoatSelection;
    combinations: Combination[];
    totalExpectedAmount: number; // For keeping track of sum before individually changing
    isIndividualAmount: boolean; // Flag to check if amounts are individually set or globally
}

// Unroll selections into valid combinations (removing duplicates like 1-1-2)
export function unrollCombinations(betType: BetType, selections: BoatSelection): Combination[] {
    const result: Combination[] = [];

    const { first, second, third } = selections;

    if (betType === '3TR') { // 3连单: exact order, no duplicates
        for (const f of first) {
            for (const s of second) {
                if (f === s) continue;
                for (const t of third) {
                    if (f === t || s === t) continue;

                    const nums = [f, s, t];
                    result.push({
                        id: nums.join('-'),
                        numbers: nums,
                        amount: 0,
                    });
                }
            }
        }
    } else if (betType === '3PL') { // 3连复: any order, no duplicates, order doesn't matter for id so we sort
        const seen = new Set<string>();
        // Wait, 3PL just needs 3 unique numbers from a pool usually, but if selected via 1st, 2nd, 3rd columns...
        // Actually, in teleboat, 3PL is selected usually by picking 3 or more boats in a single column or across.
        // If they use the standard 1st, 2nd, 3rd column:
        for (const f of first) {
            for (const s of second) {
                if (f === s) continue;
                for (const t of third) {
                    if (f === t || s === t) continue;

                    const nums = [f, s, t].sort((a, b) => a - b);
                    const id = nums.join('=');
                    if (!seen.has(id)) {
                        seen.add(id);
                        result.push({ id, numbers: nums, amount: 0 });
                    }
                }
            }
        }
    } else if (betType === '2TR') { // 2连单
        for (const f of first) {
            for (const s of second) {
                if (f === s) continue;
                const nums = [f, s];
                result.push({
                    id: nums.join('-'),
                    numbers: nums,
                    amount: 0,
                });
            }
        }
    } else if (betType === '2PL') { // 2连复
        const seen = new Set<string>();
        for (const f of first) {
            for (const s of second) {
                if (f === s) continue;
                const nums = [f, s].sort((a, b) => a - b);
                const id = nums.join('=');
                if (!seen.has(id)) {
                    seen.add(id);
                    result.push({ id, numbers: nums, amount: 0 });
                }
            }
        }
    } else if (betType === 'WIN') { // 单胜
        for (const f of first) {
            result.push({
                id: String(f),
                numbers: [f],
                amount: 0,
            });
        }
    }

    return result;
}

export const BOAT_COLORS = [
    { no: 1, colorCls: 'bg-white text-black border-neutral-300' },
    { no: 2, colorCls: 'bg-neutral-900 text-white' },
    { no: 3, colorCls: 'bg-red-600 text-white' },
    { no: 4, colorCls: 'bg-blue-600 text-white' },
    { no: 5, colorCls: 'bg-yellow-400 text-black' },
    { no: 6, colorCls: 'bg-green-600 text-white' },
];
