import type { ThriftStore } from "../../domain/entities/ThriftStore";
import type { ThriftStoreRepository } from "../../domain/repositories/ThriftStoreRepository";

const featured: ThriftStore[] = [
  {
    id: "vintage-vibes",
    name: "Vintage Vibes",
    description: "Garimpos curados com pegada retrô.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARBJPDQo7Uu8yQM4xPWLRoF-_TeSBcst8BBMAz0dACZaF9hNuYW9fyZlskN-VCyBUbQLMCPqLMBf_t1YGByk0mVteVZPK7QC3OpMdu9GR3BnopzabXnSwodUhMLJyvJj9rxOFVE9uZZZE_g7BJaxt8WTigdOQ7RmKc4Py36Z_K2ZrQuIxCdU1YJJEn9prdha2DUr9YzrNNjkyVxtQM3_0GCJFBYsJjYaPQ2B4ng6rdqa3D9gMNc_dDlJS1Jwrk5tLGtld_Y6fqaNQ",
    badgeLabel: "Mais amado",
    neighborhood: "Pinheiros",
    addressLine: "Rua Augusta, 123",
    distanceKm: 0.5,
    walkTimeMinutes: 5,
    mapImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuATD7G9oKF2W1aQjxAqHpYvVPamBIvCIZ6Q7I74RHrH7zwrJHn7iFRGMdMEHWLTMlP9DQ7oquk7Frb_j9QaIiT7ZSYMjZJhvTjFAJU7U-X73PmboiSxOHwS4QZ9mIBO-fJWAbwbdWu5yfwTrXn0c6HHGRpI5fDlZ_HckG3G5-IAsF_Vsh98T6DdyXbPl0bdG-iC9J2bjl6tqGgQIoeItBfJUqcnWgrKl9Y05nEY0VjB15UkZf5t6v0xiO0VVOuXFpoAn1Z7WNfG-dc",
    galleryUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDc8o6tnd5QOnPOUU42DRZc1lTSDgHzs_9rxx03e8f9QqfYjThUYyl2W4ZeppLlSijBNvzr7QrBJVFVUlpTnKA3NTM89MnnbqgGdAkzXfaJ9CXpj_Jk5LJUtzBc23IiYM8nJAiO1KYpp18N7_VvB2G1UhgcF61wQFhfHyL2KAjO2qT5Njga6RVVOwsTQgwtfKeTSrx_GcdUlzfWuyje8Bipda7HDjvtZGDsOpUQBGpMvCcXKNfU2alOHxgBY_Jp5t8SoGU0-D8rGo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6OPgESZuU8fSgkHv8zYcNkPjfla8WAVHotSjb0RV0qvSHKdcUdk4etGFpStgaFrvYWgXW86lRMHyppOyGxxjfQp4CBYkhhx9xRfuD9AdXBxn4gb5Ygm7jy_3aRu3YXa6vbjEucgmZ-DHeeLC2vXdqgSPx7Wmut7JlgmC_46TADF4zyytyy4NNuL61cJ_-GEDqd2J19kxjqf5rjT6NzwrsrIuVxWpaBhnTlkjHHY8SotnepNGL9ftpnp4Sw4Y09mRwLvXG8gSFTpQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVj1am_3KAlL2lhQ5nmLdTYqVkNPmwpBMSnFQ_7FPl4RLjBE_NWPIFDDe7KnvUN-nK-4cnejhE6TsZPLWy_4TdURNK0_pW2kPxyCn5O7zeREkAiTuF5jv2xAON88g3J01YFMTuQ75HqaxA15xAyzjInXSd4jxggv_PDMpBZpYk1szpy4BldQxpzmA01dlkU2HhwLTDs1ZgERC8N4sdoXvw7_3jdC77X5YmM17EEBjBVfdxNf84_yvsfEo66LBhZWyQpaF9FWYOWJw"
    ],
    socialHandle: "@vintagevibes",
    openingHours: "Seg a Sáb: 10:00 - 19:00",
    categories: ["Feminino", "Vintage", "Acessórios"]
  },
  {
    id: "secondhand-chic",
    name: "Secondhand Chic",
    description: "Peças de grife em segunda mão.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOVk3nq4m3vr37Zwd-diMYSVbsPlR3-vTbKQNtxhRnSFzz5nNb_gspC1GacDtcVHlCfAkPiabUO7DiaWj82Ej-3CXVcZBzVuAG5XwjY1lmi9MmE6TSzxBV_fpazCztCZqsZHb7-StUS-b319YJd2SziNcWu_BNV9L82uJ2e735mhIw2kdCWS0wq8xS8z7a9jNP4OOJkER7W8wXIihkJRDcKYuZ3IDi42wM_J04kfaUeprhiQ5LGy-5zz-xnE_nSs_1LKWuWxawUso",
    neighborhood: "Vila Madalena",
    addressLine: "Av. Paulista, 456",
    distanceKm: 1.2,
    walkTimeMinutes: 15
  },
  {
    id: "thrift-haven",
    name: "Thrift Haven",
    description: "Achadinhos baratos e estilosos.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD-A56MKMnqcuWT0lhYX0X9SOhpoyVFIaIyUy5TWpClE7mViw4oDUJxTUEwW__iQthJ7jJ0I7T4G7CHX6xb5kdhUBSRgTeTKIlTCadoFlAC0hYc_Nks4AQlfwFj9uySe1CifrKjMNM3t4dL7pomHXYstDcgxPBwG4URxhbzxxEez2IXjcMDZ-gubenRb9YU6apfFVWOdYVRnz4GuTedBllJoW6-QJ6rl2B0mfGj_959s0bt0DYi4XqFt7JBX3LB49HAjk3MPPN0iqE",
    neighborhood: "Centro",
    addressLine: "Rua 7 de Abril, 90",
    distanceKm: 2.4,
    walkTimeMinutes: 28
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
    neighborhood: "Consolação",
    addressLine: "Rua da Consolação, 210",
    walkTimeMinutes: 8
  },
  {
    id: "querido-brecho",
    name: "Querido Brechó",
    description: "Curadoria feminina e genderless.",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=70",
    distanceKm: 1.2,
    neighborhood: "Higienópolis",
    addressLine: "Rua Sabará, 41",
    walkTimeMinutes: 15
  },
  {
    id: "revive",
    name: "Revive Vintage",
    description: "Peças clássicas restauradas.",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=70",
    distanceKm: 2.1,
    neighborhood: "Bela Vista",
    addressLine: "Rua São Carlos do Pinhal, 15",
    walkTimeMinutes: 25
  }
];

const favorites: ThriftStore[] = [
  featured[0],
  featured[1],
  {
    id: "eco-trends",
    name: "Eco Trends",
    description: "Peças sustentáveis e slow fashion.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCl3MFVqlTBTwWfdv_BpgAwWTyAcF1A7BC-55wLzqGdf-liREBNmdO9GMc3lfyUpt9u1Vq8jRdfcgtrzoVKl7xp3ofYVQTetSzvmrOiVF2XOV8TUlArjxGb812Xhfo19Ix7ihAg02-gQYtNeX2zUaaq2X_qlEWWGQPFzeBPydbViCn-37R9c5Z_0LgRDaA8lX6Qu8FhlWP1sn9gu99PxnN8xX7ysCN2Wi8WyqfLFdogXgVU86a_17Z8_T5Rq1d25NWzPavCzjfnLlk",
    neighborhood: "Moema",
    addressLine: "Alameda dos Maracatins, 300",
    distanceKm: 3.1,
    walkTimeMinutes: 35
  },
  {
    id: "retro-closet",
    name: "Retro Closet",
    description: "Curadoria colorida e divertida.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuApzMYo7AGhzLhPB0Jy520PqIdhpEKLX6aVMaPGiv1S0EGhWOzpFiX9rdWKh4JXNUi-R0wVxH0GlWO5fHrtSfTsZWuED_-gGcl1wCMdYAKoHEErg1yYR6_HFD2ifY8ulot9UldCRXkTZkxLV5OtfsyC_uPEt6FS6yicIco564twbpkvLBuYsSuUNRVNkIAkyeyyeO6tFr2SAKD-dJPhKHDJfEfTS_RuKpc5wFAtEg5nBZRPw_lNFl7twLoqYelAPR3KreK13yl9tRg",
    neighborhood: "Liberdade",
    addressLine: "Praça da Sé, 45",
    distanceKm: 2.8,
    walkTimeMinutes: 30
  }
];

export class InMemoryThriftStoreRepository implements ThriftStoreRepository {
  async getFeatured(): Promise<ThriftStore[]> {
    return featured;
  }

  async getNearby(): Promise<ThriftStore[]> {
    return nearby;
  }

  async getFavorites(): Promise<ThriftStore[]> {
    return favorites;
  }

  async getById(id: ThriftStore["id"]): Promise<ThriftStore | null> {
    const all = [...featured, ...nearby, ...favorites];
    return all.find((s) => s.id === id) ?? null;
  }
}
