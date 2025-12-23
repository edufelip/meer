/* eslint-disable no-console */
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = Number(process.env.MOCK_SERVER_PORT) || 4010;
const BASE_URL = process.env.MOCK_SERVER_BASE_URL || `http://localhost:${PORT}`;

const seedPath = path.join(__dirname, "data", "seed.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

let stores = [...seed.stores];
let contents = [...seed.contents];
let categories = [...seed.categories];
let profile = { ...seed.profile };
let favoriteStoreIds = new Set(seed.favorites || []);
let ratings = [...(seed.ratings || [])];
let myFeedback = { ...(seed.myFeedback || {}) };

const nowIso = () => new Date().toISOString();

const base64Url = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const buildToken = (payload) => {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const body = base64Url(payload);
  return `${header}.${body}.signature`;
};

const authResponse = () => ({
  token: buildToken({
    sub: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    ownedThriftStore: profile.ownedThriftStore,
    bio: profile.bio,
    notifyNewStores: profile.notifyNewStores,
    notifyPromos: profile.notifyPromos
  }),
  refreshToken: "mock-refresh-token",
  user: {
    id: profile.id,
    name: profile.name,
    email: profile.email
  }
});

const paginate = (items, page, pageSize) => {
  const safePage = Math.max(Number(page) || 0, 0);
  const safeSize = Math.max(Number(pageSize) || 20, 1);
  const start = safePage * safeSize;
  const end = start + safeSize;
  const slice = items.slice(start, end);
  return {
    items: slice,
    page: safePage,
    hasNext: end < items.length
  };
};

const paginateOneBased = (items, page, pageSize) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.max(Number(pageSize) || 10, 1);
  const start = (safePage - 1) * safeSize;
  const end = start + safeSize;
  const slice = items.slice(start, end);
  return {
    items: slice,
    page: safePage,
    hasNext: end < items.length
  };
};

const recomputeStoreReviews = (storeId) => {
  const storeRatings = ratings.filter((rating) => String(rating.storeId) === String(storeId));
  const store = findStore(storeId);
  if (!store) return;
  const reviewCount = storeRatings.length;
  const rating =
    reviewCount === 0
      ? null
      : storeRatings.reduce((sum, rating) => sum + Number(rating.score || 0), 0) / reviewCount;
  stores = stores.map((item) =>
    String(item.id) === String(storeId)
      ? { ...item, reviewCount, rating: rating == null ? item.rating : Number(rating.toFixed(1)) }
      : item
  );
};

const findStore = (id) => stores.find((store) => String(store.id) === String(id));

app.get("/health", (req, res) => res.json({ ok: true, time: nowIso() }));

app.get("/featured", (req, res) => {
  res.json(stores.slice(0, 5));
});

app.get("/nearby", (req, res) => {
  const pageIndex = Number(req.query.pageIndex ?? 0);
  const pageSize = Number(req.query.pageSize ?? 10);
  res.json(paginate(stores, pageIndex, pageSize));
});

app.get("/stores", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const categoryId = String(req.query.categoryId || "").trim().toLowerCase();
  const category = categoryId
    ? categories.find(
        (item) => item.id.toLowerCase() === categoryId || item.nameStringId.toLowerCase() === categoryId
      )
    : null;
  let filtered = [...stores];

  if (q) {
    filtered = filtered.filter((store) => store.name.toLowerCase().includes(q));
  }

  if (categoryId) {
    const categoryHints = new Set(
      [categoryId, category?.id, category?.nameStringId]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
    );
    filtered = filtered.filter((store) =>
      (store.categories || []).some((entry) => {
        const normalized = String(entry).toLowerCase();
        return Array.from(categoryHints).some((hint) => normalized.includes(hint));
      })
    );
  }

  const page = Number(req.query.page ?? 0);
  const pageSize = Number(req.query.pageSize ?? 10);
  res.json(paginate(filtered, page, pageSize));
});

app.get("/stores/favorites", (req, res) => {
  res.json(stores.filter((store) => favoriteStoreIds.has(store.id)));
});

app.get("/stores/:id", (req, res) => {
  const store = findStore(req.params.id);
  res.json(store || null);
});

app.get("/stores/:id/ratings", (req, res) => {
  const storeId = req.params.id;
  const list = ratings
    .filter((rating) => String(rating.storeId) === String(storeId))
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  res.json(paginateOneBased(list, page, pageSize));
});

app.get("/stores/:id/feedback", (req, res) => {
  const feedback = myFeedback[req.params.id];
  if (!feedback) {
    res.status(404).end();
    return;
  }
  res.json(feedback);
});

app.post("/stores/:id/feedback", (req, res) => {
  const storeId = req.params.id;
  const payload = req.body || {};
  const entry = { storeId, score: payload.score, body: payload.body };
  myFeedback[storeId] = entry;
  const ratingId = `rating-${ratings.length + 1}`;
  ratings = [
    {
      id: ratingId,
      storeId,
      score: payload.score,
      body: payload.body,
      authorName: profile.name || "Você",
      authorAvatarUrl: profile.avatarUrl,
      createdAt: nowIso()
    },
    ...ratings
  ];
  recomputeStoreReviews(storeId);
  res.status(204).end();
});

app.delete("/stores/:id/feedback", (req, res) => {
  const storeId = req.params.id;
  delete myFeedback[storeId];
  ratings = ratings.filter(
    (rating) => !(String(rating.storeId) === String(storeId) && rating.authorName === profile.name)
  );
  recomputeStoreReviews(storeId);
  res.status(204).end();
});

app.post("/stores", (req, res) => {
  const id = `store-${stores.length + 1}`;
  const payload = req.body || {};
  const store = {
    id,
    name: payload.name || `Brechó ${id}`,
    tagline: payload.tagline || "Novo brechó",
    coverImageUrl: payload.coverImageUrl || stores[0]?.coverImageUrl,
    galleryUrls: payload.galleryUrls || stores[0]?.galleryUrls || [],
    addressLine: payload.addressLine || "Rua Nova, 100",
    latitude: payload.latitude ?? -23.56,
    longitude: payload.longitude ?? -46.64,
    openingHours: payload.openingHours || "Segunda a Sábado: 10:00 - 19:00",
    categories: payload.categories || ["Geral"],
    neighborhood: payload.neighborhood || "Centro",
    distanceKm: payload.distanceKm ?? 2.1,
    walkTimeMinutes: payload.walkTimeMinutes ?? 22,
    badge_label: payload.badge_label,
    rating: payload.rating ?? 4.5,
    reviewCount: payload.reviewCount ?? 0,
    description: payload.description || "Brechó recém-criado."
  };
  stores = [store, ...stores];
  res.json(store);
});

app.put("/stores/:id", (req, res) => {
  const id = req.params.id;
  const payload = req.body || {};
  stores = stores.map((store) => (store.id === id ? { ...store, ...payload } : store));
  const updated = findStore(id);
  res.json(updated);
});

app.post("/stores/:id/photos/uploads", (req, res) => {
  const count = Math.max(Number(req.body?.count) || 1, 1);
  const contentTypes = Array.isArray(req.body?.contentTypes) ? req.body.contentTypes : [];
  const uploads = Array.from({ length: count }).map((_, idx) => {
    const fileKey = `store-${req.params.id}-photo-${Date.now()}-${idx + 1}`;
    return {
      uploadUrl: `${BASE_URL}/uploads/${fileKey}?token=mock`,
      fileKey,
      contentType: contentTypes[idx] || "image/jpeg"
    };
  });
  res.json({ uploads });
});

app.put("/stores/:id/photos", (req, res) => {
  const store = findStore(req.params.id);
  res.json(store || null);
});

app.get("/categories", (req, res) => res.json(categories));

app.get("/contents", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const storeId = String(req.query.storeId || "").trim();
  const page = Number(req.query.page ?? 0);
  const pageSize = Number(req.query.pageSize ?? 20);
  let filtered = [...contents];

  if (q) {
    filtered = filtered.filter((item) => item.title.toLowerCase().includes(q));
  }

  if (storeId) {
    filtered = filtered.filter((item) => String(item.storeId) === storeId);
  }

  res.json(paginate(filtered, page, pageSize));
});

app.post("/contents", (req, res) => {
  const id = `content-${contents.length + 1}`;
  const payload = req.body || {};
  const store = findStore(payload.storeId);
  const item = {
    id,
    title: payload.title || "Novo conteúdo",
    description: payload.description || "",
    categoryLabel: payload.categoryLabel || "Guia",
    imageUrl: payload.imageUrl || stores[0]?.coverImageUrl,
    storeId: payload.storeId,
    thriftStoreName: store?.name || "",
    thriftStoreCoverImageUrl: store?.coverImageUrl || null,
    createdAt: nowIso()
  };
  contents = [item, ...contents];
  res.json({ id });
});

app.put("/contents/:id", (req, res) => {
  const payload = req.body || {};
  const id = req.params.id;
  contents = contents.map((item) => (item.id === id ? { ...item, ...payload } : item));
  res.status(204).end();
});

app.post("/contents/:id/image/upload", (req, res) => {
  const fileKey = `content-${req.params.id}-image-${Date.now()}`;
  res.json({
    uploadUrl: `${BASE_URL}/uploads/${fileKey}?token=mock`,
    fileKey,
    contentType: req.body?.contentType || "image/jpeg"
  });
});

app.delete("/contents/:id", (req, res) => {
  const id = req.params.id;
  contents = contents.filter((item) => item.id !== id);
  res.status(204).end();
});

app.get("/favorites", (req, res) => {
  res.json(stores.filter((store) => favoriteStoreIds.has(store.id)));
});

app.post("/favorites/:id", (req, res) => {
  favoriteStoreIds.add(req.params.id);
  res.status(204).end();
});

app.delete("/favorites/:id", (req, res) => {
  favoriteStoreIds.delete(req.params.id);
  res.status(204).end();
});

app.get("/auth/me", (req, res) => {
  res.json({ user: profile });
});

app.post("/auth/login", (req, res) => res.json(authResponse()));
app.post("/auth/signup", (req, res) => res.json(authResponse()));
app.post("/auth/google", (req, res) => res.json(authResponse()));
app.post("/auth/apple", (req, res) => res.json(authResponse()));
app.post("/auth/refresh", (req, res) => res.json(authResponse()));

app.patch("/profile", (req, res) => {
  profile = { ...profile, ...(req.body || {}) };
  res.json(profile);
});

app.post("/profile/avatar/upload", (req, res) => {
  const fileKey = `avatar-${Date.now()}`;
  res.json({
    uploadUrl: `${BASE_URL}/uploads/${fileKey}?token=mock`,
    fileKey,
    contentType: req.body?.contentType || "image/jpeg"
  });
});

app.delete("/account", (req, res) => {
  res.status(204).end();
});

app.post("/support/contact", (req, res) => {
  res.status(204).end();
});

app.put("/uploads/:fileKey", (req, res) => {
  res.status(200).end();
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock server running on ${BASE_URL}`);
});
