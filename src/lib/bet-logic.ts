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

    // Helper to check if a combination of numbers has duplicates
    const hasDuplicates = (nums: number[]) => new Set(nums).size !== nums.length;

    if (betType === '3TR') { // 3連単: exact order, no duplicates
        for (const f of first) {
            for (const s of second) {
                for (const t of third) {
                    const nums = [f, s, t];
                    if (hasDuplicates(nums)) continue;

                    result.push({
                        id: nums.join('-'),
                        numbers: nums,
                        amount: 0,
                    });
                }
            }
        }
    } else if (betType === '3PL') { // 3連複: any order, no duplicates
        const seen = new Set<string>();
        for (const f of first) {
            for (const s of second) {
                for (const t of third) {
                    const nums = [f, s, t];
                    if (hasDuplicates(nums)) continue;

                    const sortedNums = [...nums].sort((a, b) => a - b);
                    const id = sortedNums.join('=');
                    if (!seen.has(id)) {
                        seen.add(id);
                        result.push({ id, numbers: sortedNums, amount: 0 });
                    }
                }
            }
        }
    } else if (betType === '2TR') { // 2連単
        for (const f of first) {
            for (const s of second) {
                const nums = [f, s];
                if (hasDuplicates(nums)) continue;

                result.push({
                    id: nums.join('-'),
                    numbers: nums,
                    amount: 0,
                });
            }
        }
    } else if (betType === '2PL') { // 2連複
        const seen = new Set<string>();
        for (const f of first) {
            for (const s of second) {
                const nums = [f, s];
                if (hasDuplicates(nums)) continue;

                const sortedNums = [...nums].sort((a, b) => a - b);
                const id = sortedNums.join('=');
                if (!seen.has(id)) {
                    seen.add(id);
                    result.push({ id, numbers: sortedNums, amount: 0 });
                }
            }
        }
    } else if (betType === 'WIN') { // 単勝
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

/**
 * 順不同で組番を扱う券種（2連複・3連複・拡連複）。
 * 比較時に番号をソートし、表記ゆれ（社内"1=3" と 公式"1-3"）を吸収する。
 */
export const UNORDERED_BET_TYPES = new Set<string>(["2PL", "3PL", "WIDE"]);

/**
 * 買い目の区切り（"="・"-"）と並び順の違いを正規化し、券種ルールに沿った比較用キーを返す。
 * 例: 2連複 "1=3"（社内表記）も 公式 "1-3" も → "1-3" に揃い、一致判定できる。
 */
export function normalizeCombo(combo: string, betType: string): string {
    const nums = combo.split(/[-=]/).map((n) => n.trim()).filter(Boolean);
    if (UNORDERED_BET_TYPES.has(betType)) {
        nums.sort((a, b) => Number(a) - Number(b));
    }
    return nums.join("-");
}
