import type { Category } from "../../domain/entities/Category";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository";

const categories: Category[] = [
  {
    id: "casa",
    nameStringId: "brecho_de_casa",
    imageResId: "brecho-categories-house"
  },
  {
    id: "masculino",
    nameStringId: "brecho_masculino",
    imageResId: "categories-masculino"
  },
  {
    id: "feminino",
    nameStringId: "brecho_feminino",
    imageResId: "categories-feminino"
  },
  {
    id: "infantil",
    nameStringId: "brecho_infantil",
    imageResId: "categories-infantil"
  },
  {
    id: "luxo",
    nameStringId: "brecho_de_luxo",
    imageResId: "categories-luxo"
  },
  {
    id: "designer",
    nameStringId: "brecho_de_designer",
    imageResId: "categories-designer"
  },
  {
    id: "desapego",
    nameStringId: "brecho_de_desapego",
    imageResId: "categories-desapego"
  },
  {
    id: "geral",
    nameStringId: "brechos_gerais",
    imageResId: "categories-geral"
  }
];

export class InMemoryCategoryRepository implements CategoryRepository {
  private cached: Category[] | null = null;

  async list(): Promise<Category[]> {
    return categories;
  }

  async getCached(): Promise<Category[] | null> {
    return this.cached;
  }

  async saveCache(items: Category[]): Promise<void> {
    this.cached = items;
  }
}
