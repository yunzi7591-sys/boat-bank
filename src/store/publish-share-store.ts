import { create } from "zustand";

type PublishSharePayload = {
    predictionId: string;
    placeName: string;
    raceNumber: number;
};

type PublishShareStore = {
    payload: PublishSharePayload | null;
    open: (payload: PublishSharePayload) => void;
    close: () => void;
};

export const usePublishShareStore = create<PublishShareStore>((set) => ({
    payload: null,
    open: (payload) => set({ payload }),
    close: () => set({ payload: null }),
}));
