import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: env.VITE_FIREBASE_APP_ID ?? "",
  ...(env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID }
    : {}),
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
);

export interface FirebaseContext {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let contextPromise: Promise<FirebaseContext | null> | null = null;

export function getFirebaseContext(): Promise<FirebaseContext | null> {
  if (!firebaseConfigured) return Promise.resolve(null);
  if (!contextPromise) {
    contextPromise = (async () => {
      const [appSdk, authSdk, firestoreSdk] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
      const app = appSdk.getApps().length
        ? appSdk.getApp()
        : appSdk.initializeApp(firebaseConfig);
      return {
        app,
        auth: authSdk.getAuth(app),
        db: firestoreSdk.getFirestore(app),
      };
    })();
  }
  return contextPromise;
}
