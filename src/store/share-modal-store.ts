import { create } from "zustand";

type SharePromoPayload = {
    predictionId: string;
    placeName: string;
    raceNumber: number;
};

type SharePromoStore = {
    payload: SharePromoPayload | null;
    open: (payload: SharePromoPayload) => void;
    close: () => void;
};

export const useSharePromoStore = create<SharePromoStore>((set) => ({
    payload: null,
    open: (payload) => set({ payload }),
    close: () => set({ payload: null }),
}));
