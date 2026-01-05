import { create } from "zustand";

type StoreSummary = {
  rating: number;
  reviewCount: number;
};

type RatingChangeParams = {
  storeId: string;
  prevScore?: number | null;
  nextScore: number;
  baseRating?: number | null;
  baseReviewCount?: number | null;
};

type RatingDeleteParams = {
  storeId: string;
  prevScore?: number | null;
  baseRating?: number | null;
  baseReviewCount?: number | null;
};

type StoreSummaryState = {
  summaries: Record<string, StoreSummary>;
  ensureSummary: (storeId: string, rating?: number | null, reviewCount?: number | null) => void;
  setSummary: (storeId: string, rating?: number | null, reviewCount?: number | null) => void;
  applyRatingChange: (params: RatingChangeParams) => StoreSummary | null;
  applyRatingDeletion: (params: RatingDeleteParams) => StoreSummary | null;
  reset: () => void;
};

const toNumber = (value?: number | null) => (Number.isFinite(value) ? (value as number) : 0);

const normalizeSummary = (rating?: number | null, reviewCount?: number | null): StoreSummary => {
  const safeCount = Math.max(0, Math.floor(toNumber(reviewCount)));
  const safeRating = safeCount === 0 ? 0 : toNumber(rating);
  return { rating: safeRating, reviewCount: safeCount };
};

const resolveSummary = (
  summaries: Record<string, StoreSummary>,
  storeId: string,
  baseRating?: number | null,
  baseReviewCount?: number | null
) => summaries[storeId] ?? normalizeSummary(baseRating, baseReviewCount);

export const useStoreSummaryStore = create<StoreSummaryState>((set, get) => ({
  summaries: {},
  ensureSummary: (storeId, rating, reviewCount) => {
    set((state) => {
      if (state.summaries[storeId]) return state;
      const next = normalizeSummary(rating, reviewCount);
      return { summaries: { ...state.summaries, [storeId]: next } };
    });
  },
  setSummary: (storeId, rating, reviewCount) => {
    const next = normalizeSummary(rating, reviewCount);
    set((state) => ({ summaries: { ...state.summaries, [storeId]: next } }));
  },
  applyRatingChange: ({ storeId, prevScore, nextScore, baseRating, baseReviewCount }) => {
    if (!storeId || !Number.isFinite(nextScore)) return null;
    const { summaries } = get();
    const current = resolveSummary(summaries, storeId, baseRating, baseReviewCount);
    const count = current.reviewCount;
    const rating = current.rating;
    const prev = Number.isFinite(prevScore) ? (prevScore as number) : null;

    let nextCount = count;
    let nextRating = rating;

    if (prev !== null) {
      const safeCount = Math.max(1, count);
      const total = rating * safeCount - prev + nextScore;
      nextCount = safeCount;
      nextRating = safeCount > 0 ? total / safeCount : nextScore;
    } else {
      nextCount = count + 1;
      const total = rating * count + nextScore;
      nextRating = nextCount > 0 ? total / nextCount : nextScore;
    }

    const next = normalizeSummary(nextRating, nextCount);
    set((state) => ({ summaries: { ...state.summaries, [storeId]: next } }));
    return next;
  },
  applyRatingDeletion: ({ storeId, prevScore, baseRating, baseReviewCount }) => {
    if (!storeId || !Number.isFinite(prevScore)) return null;
    const { summaries } = get();
    const current = resolveSummary(summaries, storeId, baseRating, baseReviewCount);
    const count = current.reviewCount;
    const rating = current.rating;
    const prev = Number.isFinite(prevScore) ? (prevScore as number) : 0;

    let nextCount = Math.max(0, count - 1);
    let nextRating = 0;

    if (count > 1) {
      const total = rating * count - prev;
      nextRating = total / nextCount;
    }

    const next = normalizeSummary(nextRating, nextCount);
    set((state) => ({ summaries: { ...state.summaries, [storeId]: next } }));
    return next;
  },
  reset: () => set({ summaries: {} })
}));
