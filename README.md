# Meer

<p align="center">
  <a href="https://android-arsenal.com/api?level=24"><img alt="API" src="https://img.shields.io/badge/API-24%2B-brightgreen.svg?style=flat"/></a>
  <a href="https://github.com/edufelip"><img alt="Build Status" src="https://img.shields.io/static/v1?label=CI&message=local%20scripts&color=green&logo=github"/></a>
  <a href="https://medium.com/@eduardofelipi"><img alt="Medium" src="https://img.shields.io/static/v1?label=Medium&message=@edu_santos&color=gray&logo=medium"/></a><br>
  <a href="https://www.youtube.com/channel/UCYcwwX7nDU_U0FP-TsXMwVg"><img alt="Profile" src="https://img.shields.io/static/v1?label=Youtube&message=edu_santos&color=red&logo=youtube"/></a>
  <a href="https://github.com/edufelip"><img alt="Profile" src="https://img.shields.io/static/v1?label=Github&message=edufelip&color=white&logo=github"/></a>
  <a href="https://www.linkedin.com/in/eduardo-felipe-dev/"><img alt="Linkedin" src="https://img.shields.io/static/v1?label=Linkedin&message=edu_santos&color=blue&logo=linkedin"/></a>
</p>

<p align="center">  
🛍️ Guia Brechó — encontre, salve e explore brechós com UI mobile first.
</p>

## This project uses
* Expo (SDK 54) + dev client (native Google Sign-In requires dev build)
* React Native + NativeWind
* React Navigation (stack + tabs)
* Axios + @tanstack/react-query (requests, caching, retry/refresh queue)
* Zustand (shared UI state across screens)
* @react-native-google-signin/google-signin (native Google login → backend)
* AsyncStorage (prefs, token cache, favorites outbox)
* Clean architecture: Presentation → Domain → Data, DI via provider hook

Key recent changes
- Login is the entry route; Google Sign-In uses native SDK (no Expo AuthSession). Backend issues tokens; Firebase Auth is no longer used.
- Token refresh flow: on first 401 we call `/auth/refresh` (max 3 attempts), retry the original request, then logout on failure. All requests send `X-App-Package: com.edufelip.meer`.
- Home no longer uses `/home`; we fetch in paralelo: `/featured?lat&lng`, `/nearby?lat&lng&pageIndex=0&pageSize=10`, `/contents?page=0&pageSize=10`. Sections render as soon as each response arrives, with skeletons.
- Favorites: optimistic UI + local outbox queue + background sync; falls back to server list when online.
- Location: asks permission; if denied uses São Paulo fallback (-23.5561782, -46.6375468). Chips built from nearby neighborhoods.

## Installation
```bash
git clone <repo>
cd Meer
npm install   # fix ~/.npm permissions first if needed
```

Create `.env` (not committed) with:
```
EXPO_PUBLIC_GOOGLE_WEB_ID=<your web client id>
EXPO_PUBLIC_GOOGLE_ANDROID_ID=<android client id>
EXPO_PUBLIC_GOOGLE_IOS_ID=<ios client id>
```
(Keys stay local; production IDs go in your own env).

Update API/web URLs in `constants/urls.json`:
- `devApiBaseUrl`: dev/local backend base URL used in debug builds.
- `prodApiBaseUrl`: production backend base URL used in production builds.
- `webBaseUrl`: public site used for share links/deep links.

### Web Admin (Next.js)

- Path: `web/`
- Create `web/.env.local` with at least:
```
NEXT_PUBLIC_API_BASE_URL=http://192.168.15.64:8080   # your backend base URL
NEXT_PUBLIC_APP_PACKAGE=com.edufelip.meer
```
- Run:
```
cd web
npm install
npm run dev
```
The web admin calls the backend through the `/api` proxy (see `next.config.js`), so `/api/dashboard/login` rewrites to your `NEXT_PUBLIC_API_BASE_URL/dashboard/login`. If you see HTML in responses, the request is still hitting the Next app—check that the env is set and restart `npm run dev`.

## Run / Build
- Dev client (required for Google Sign-In):  
  ```bash
  npx expo run:ios --device
  npx expo run:android
  ```
- Start bundler: `npm start`
- Lint: `npm run lint`

## Testing
- Docs index: `docs/tests-index.md`

## Deep links

- Route: `/store/:id` opens the Store Detail screen.
- Store Detail Share button uses `https://guiabrecho.com.br/store/<id>`.

Setup details (iOS Associated Domains, Android App Links, and web fallback hosting): `docs/deep-links.md`.

## API contracts (current)
- Auth
  - `POST /auth/signup` `{ name,email,password }`
  - `POST /auth/login` `{ email,password }`
  - `POST /auth/google` `{ idToken, provider:"google", client:"ios|android" }`
  - `GET /auth/me` → user
  - `POST /auth/refresh` `{ refreshToken }`
- Home data (3 chamadas paralelas, todas com Bearer + `X-App-Package`)
  - `GET /featured?lat&lng`
  - `GET /nearby?lat&lng&pageIndex=0&pageSize=10`
  - `GET /contents?page=0&pageSize=10` (optional `q`, `sort=newest|oldest`)
- Favorites
  - `GET /favorites`
  - `POST /favorites/toggle` `{ storeId, isFavorite }` (optimistic outbox no cliente)
- Categories / Busca / Lojas
  - `GET /categories`
  - `GET /stores/:id`
  - `GET /stores/featured`, `GET /stores/nearby`, `GET /stores` (search/pagination by category/query)
  - `POST /stores/{id}/feedback`, `GET /stores/{id}/feedback`, `DELETE /stores/{id}/feedback`
- Profile
  - `GET /profile`
  - `PATCH /profile` with only touched fields (supports avatar upload)
  - `DELETE /account`

Headers always include:  
`Authorization: Bearer <token>` (when available)  
`X-App-Package: com.edufelip.meer`

## Architecture (Clean)
UI (screens/components) → use cases → repositories → data sources.  
DI via `DependenciesProvider` hook.  
Network layer centraliza axios interceptors (logging, package header, token refresh + queued retries).

## State Management
- Local UI state: `useState` in the screen/component.
- Server state & caching: React Query.
- Shared UI state (cross-screen, optimistic updates): Zustand stores in `src/presentation/state`.
- Stores are reset on logout (see `src/presentation/state/resetAllStores.ts`).

## Notes
- Requires device or simulator with dev build for Google Sign-In (Expo Go não serve).
- Location permission opcional; fallback para São Paulo se negada ou ausente.
