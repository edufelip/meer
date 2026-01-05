import { create } from "zustand";

type NetworkStatusState = {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
  reset: () => void;
};

export const useNetworkStatusStore = create<NetworkStatusState>((set) => ({
  isOnline: true,
  setIsOnline: (value) => set({ isOnline: value }),
  reset: () => set({ isOnline: true })
}));
