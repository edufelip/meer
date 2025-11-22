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
* Expo (SDK 54)
* React Native + NativeWind
* React Navigation (stack + tabs)
* Firebase Authentication (email/senha + Google) — via @react-native-firebase/app/auth (domain/use cases decoupled to swap providers later)
* Firebase Messaging, Crashlytics, Performance (scaffolded)
* AsyncStorage (preferências locais)
* Clean architecture: Presentation → Domain → Data, DI via provider hook

Key recent changes
- Login screen added as initial route; Google button only on iOS. Email/senha auth wired to Firebase; validations for e-mail e senha.
- Signup screen with validations, Firebase email/password creation, and name saved to displayName.
- Edit Profile preloads profile, shows bottom-sheet avatar picker (camera/galeria stub), validates bio (200 chars) and name, persists toggle prefs in AsyncStorage.
- Firebase config paths set for iOS/Android; service files are git-ignored (add your real `GoogleService-Info.plist` at repo root and `android/app/google-services.json` locally).

## Installation
```bash
git clone <repo>
cd Meer
npm install   # fix ~/.npm permissions first if needed
```

## Firebase setup (local)
1) Download `GoogleService-Info.plist` (iOS) and place at project root.  
2) Download `google-services.json` (Android) and place at `android/app/google-services.json`.  
3) Bundle/package ID: `com.edufelip.meer` (set in app.json).  
4) Run `npm install` to pull @react-native-firebase packages (requires fixing ~/.npm permissions if prompted).  
5) Start: `npm start -- --clear`

## Build & Run
- Expo Go / Dev build: `npm start`
- iOS simulator: `npm run ios`
- Android emulator: `npm run android`

## Testing
- Lint: `npm run lint`

## Architecture (Clean)
UI (screens/components) → use cases → repositories → data sources.  
DI provided via `DependenciesProvider` hook.

## Notes
- Google login needs valid client IDs in `LoginScreen` (Expo Auth Session). Replace placeholder IDs with yours.
- Service files are ignored; ensure you add them locally before building.
