import { create } from "zustand";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  loading: auth !== null,

  signIn: async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      alert(`Sign-in failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  signOut: async () => {
    if (auth) await firebaseSignOut(auth);
  },
}));

if (auth) {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, loading: false });
  });
}