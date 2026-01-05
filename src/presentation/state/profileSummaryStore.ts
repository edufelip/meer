import { create } from "zustand";
import type { User } from "../../domain/entities/User";

export type ProfileSummary = User & {
  bio?: string;
  notifyNewStores?: boolean;
  notifyPromos?: boolean;
  ownedThriftStore?: any;
};

type ProfileSummaryState = {
  profile: ProfileSummary | null;
  setProfile: (profile: ProfileSummary | null) => void;
  updateProfile: (patch: Partial<ProfileSummary>) => void;
  reset: () => void;
};

export const useProfileSummaryStore = create<ProfileSummaryState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (patch) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...patch } : (patch as ProfileSummary)
    })),
  reset: () => set({ profile: null })
}));
