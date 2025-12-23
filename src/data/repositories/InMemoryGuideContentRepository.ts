import type { GuideContent } from "../../domain/entities/GuideContent";
import type {
  GuideContentListParams,
  GuideContentPage,
  GuideContentRepository
} from "../../domain/repositories/GuideContentRepository";

const guides: GuideContent[] = [
  {
    id: "garimpo-sucesso",
    title: "Dicas para um garimpo de sucesso",
    description: "Aprenda a encontrar as melhores peças em brechós.",
    categoryLabel: "Guia de estilo",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASh-dosAr4TVNex49PUkBKFWcLJ5g7HOQJC7p6SaRZyNznaks3TiQuWOksGvrnYi6IeO5sMPBjaerUTI7HzO4xaF5jyAX9NkZS80VOX-lpdnJIHTDaM3nL8ANPzyy3T2OEPfbqu2cuQlC-_PdB_tFutmEey75ynvkAcO3CQis8asojk9mkENmn1Hg88uqHJEOxr2z8LyIELsQfsWo_vVdfdLbws8VFobNPLNE5cMP-Snp3CsMplvntxVg4BQTHBAk7pgXTv1Px3Ls",
    storeId: "demo-store",
    thriftStoreName: "Guia Brechó",
    thriftStoreCoverImageUrl: null,
    createdAt: "2024-01-02T00:00:00.000Z"
  },
  {
    id: "cuidados-pecas",
    title: "Cuidados com tecidos delicados",
    description: "Como lavar e armazenar achadinhos vintage.",
    categoryLabel: "Cuidados",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=70",
    storeId: "demo-store",
    thriftStoreName: "Guia Brechó",
    thriftStoreCoverImageUrl: null,
    createdAt: "2023-12-30T00:00:00.000Z"
  }
];

export class InMemoryGuideContentRepository implements GuideContentRepository {
  async listLatest(params?: GuideContentListParams): Promise<GuideContentPage> {
    const q = params?.q?.trim().toLowerCase();
    const storeId = params?.storeId;
    const sort = params?.sort ?? "newest";
    const page = params?.page ?? 0;
    const pageSize = params?.pageSize ?? 20;

    const filtered = guides
      .filter((item) => (!storeId ? true : item.storeId === storeId))
      .filter((item) => {
        if (!q) return true;
        const title = item.title?.toLowerCase() ?? "";
        const description = item.description?.toLowerCase() ?? "";
        return title.includes(q) || description.includes(q);
      })
      .slice()
      .sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
      });

    const start = Math.max(0, page) * Math.max(1, pageSize);
    const items = filtered.slice(start, start + pageSize);
    const hasNext = start + pageSize < filtered.length;

    return { items, page, hasNext };
  }

  async createContent(): Promise<{ id: string }> {
    throw new Error("InMemory repository does not support createContent");
  }

  async updateContent(): Promise<void> {
    throw new Error("InMemory repository does not support updateContent");
  }

  async requestImageUpload(): Promise<{ uploadUrl: string; fileKey: string; contentType: string }> {
    throw new Error("InMemory repository does not support requestImageUpload");
  }

  async deleteContent(): Promise<void> {
    throw new Error("InMemory repository does not support deleteContent");
  }
}
