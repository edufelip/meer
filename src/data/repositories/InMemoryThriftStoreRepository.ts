import type { ThriftStore } from "../../domain/entities/ThriftStore";
import type { ThriftStoreRepository } from "../../domain/repositories/ThriftStoreRepository";

const featured: ThriftStore[] = [
  {
    id: "vintage-vibes",
    name: "Vintage Vibes",
    description: "Garimpos curados com pegada retrô.",
    imageUrl:
      "https://images.unsplash.com/photo-1441123694162-e54a981ceba3?auto=format&fit=crop&w=1200&q=70",
    badgeLabel: "Mais amado",
    neighborhood: "Pinheiros"
  },
  {
    id: "secondhand-chic",
    name: "Secondhand Chic",
    description: "Peças de grife em segunda mão.",
    imageUrl:
      "https://images.unsplash.com/photo-1542293777398-f4501b6d06c2?auto=format&fit=crop&w=1200&q=70",
    neighborhood: "Vila Madalena"
  },
  {
    id: "thrift-haven",
    name: "Thrift Haven",
    description: "Achadinhos baratos e estilosos.",
    imageUrl:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=70",
    neighborhood: "Centro"
  }
];

const nearby: ThriftStore[] = [
  {
    id: "garimpo-urbano",
    name: "Garimpo Urbano",
    description: "Mix de moda street e vintage.",
    imageUrl:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1400&q=70",
    distanceKm: 0.6,
    neighborhood: "Consolação"
  },
  {
    id: "querido-brecho",
    name: "Querido Brechó",
    description: "Curadoria feminina e genderless.",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=70",
    distanceKm: 1.2,
    neighborhood: "Higienópolis"
  },
  {
    id: "revive",
    name: "Revive Vintage",
    description: "Peças clássicas restauradas.",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=70",
    distanceKm: 2.1,
    neighborhood: "Bela Vista"
  }
];

export class InMemoryThriftStoreRepository implements ThriftStoreRepository {
  async getFeatured(): Promise<ThriftStore[]> {
    return featured;
  }

  async getNearby(): Promise<ThriftStore[]> {
    return nearby;
  }
}
