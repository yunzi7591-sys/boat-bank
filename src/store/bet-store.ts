import { create } from 'zustand';
import { BetType, BoatSelection, Combination, Formation, unrollCombinations } from '@/lib/bet-logic';

interface BetStore {
    // Marksheet state
    activeBetType: BetType;
    selections: BoatSelection;

    // Marksheet actions
    setBetType: (type: BetType) => void;
    toggleSelection: (position: keyof BoatSelection, boatNumber: number) => void;
    toggleAll: (position: keyof BoatSelection, excludeNumbers: number[]) => void;
    clearSelections: () => void;

    // Cart state
    cart: Formation[];

    // Cart actions
    addFormationToCart: (defaultAmount?: number) => void; // Helper that takes current selections -> formations -> cart
    updateCartItemAmount: (formationId: string, combinationId: string, amount: number) => void;
    updateCartFormationAmount: (formationId: string, amount: number) => void;
    removeCombination: (formationId: string, combinationId: string) => void;
    removeFormation: (formationId: string) => void;
    clearCart: () => void;
}

const initialSelections: BoatSelection = {
    first: [],
    second: [],
    third: [],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useBetStore = create<BetStore>((set, get) => ({
    activeBetType: '3TR',
    selections: { ...initialSelections },

    setBetType: (type: BetType) => {
        set({ activeBetType: type, selections: { ...initialSelections } });
    },

    toggleSelection: (position: keyof BoatSelection, boatNumber: number) => {
        set((state) => {
            const current = state.selections[position];
            const newSelection = current.includes(boatNumber)
                ? current.filter((n) => n !== boatNumber)
                : [...current, boatNumber].sort((a, b) => a - b);

            return {
                selections: {
                    ...state.selections,
                    [position]: newSelection,
                },
            };
        });
    },

    toggleAll: (position: keyof BoatSelection, excludeNumbers: number[]) => {
        set((state) => {
            const allBoats = [1, 2, 3, 4, 5, 6];
            const targetBoats = allBoats.filter((n) => !excludeNumbers.includes(n));
            const current = state.selections[position];

            // If all target boats are already selected, clear them. Otherwise, select all target boats.
            const isAllSelected = targetBoats.every((n) => current.includes(n));

            return {
                selections: {
                    ...state.selections,
                    [position]: isAllSelected ? [] : targetBoats,
                }
            };
        });
    },

    clearSelections: () => {
        set({ selections: { ...initialSelections } });
    },

    cart: [],

    addFormationToCart: (defaultAmount = 0) => {
        set((state) => {
            const unrolled = unrollCombinations(state.activeBetType, state.selections);
            if (unrolled.length === 0) return state; // Do nothing if invalid formation

            // Map the defaultAmount if provided
            const combinationsWithAmount = unrolled.map(c => ({
                ...c,
                amount: defaultAmount
            }));

            const newFormation: Formation = {
                id: generateId(),
                betType: state.activeBetType,
                selections: JSON.parse(JSON.stringify(state.selections)), // deep copy
                combinations: combinationsWithAmount,
                totalExpectedAmount: defaultAmount,
                isIndividualAmount: false,
            };

            return {
                cart: [...state.cart, newFormation],
                selections: { ...initialSelections }, // Clear marksheet after adding
            };
        });
    },

    updateCartItemAmount: (formationId, combinationId, amount) => {
        set((state) => ({
            cart: state.cart.map((f) => {
                if (f.id !== formationId) return f;
                const newCombinations = f.combinations.map((c) =>
                    c.id === combinationId ? { ...c, amount } : c
                );
                return { ...f, combinations: newCombinations, isIndividualAmount: true };
            })
        }));
    },

    updateCartFormationAmount: (formationId, amount) => {
        set((state) => ({
            cart: state.cart.map((f) => {
                if (f.id !== formationId) return f;
                const newCombinations = f.combinations.map((c) => ({ ...c, amount }));
                return { ...f, combinations: newCombinations, isIndividualAmount: false, totalExpectedAmount: amount };
            })
        }));
    },

    removeCombination: (formationId, combinationId) => {
        set((state) => {
            const newCart = state.cart.map((f) => {
                if (f.id !== formationId) return f;
                const newCombinations = f.combinations.filter((c) => c.id !== combinationId);
                return { ...f, combinations: newCombinations };
            }).filter((f) => f.combinations.length > 0); // Remove formation if empty

            return { cart: newCart };
        });
    },

    removeFormation: (formationId) => {
        set((state) => ({
            cart: state.cart.filter((f) => f.id !== formationId)
        }));
    },

    clearCart: () => set({ cart: [] }),
}));
