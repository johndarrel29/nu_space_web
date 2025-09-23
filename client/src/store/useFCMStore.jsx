import { create } from "zustand";

export const useFCMStore = create((set) => ({
    deviceToken: null,
    setDeviceToken: (token) => set({ deviceToken: token }),
}));
