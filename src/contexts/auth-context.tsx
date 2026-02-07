"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase";

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: Date;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create or update user document in Firestore
async function syncUserToFirestore(user: User) {
  const fireDb = getFirebaseDb();
  if (!fireDb) return;

  const userRef = doc(fireDb, "users", user.uid);
  const userSnap = await getDoc(userRef).catch(() => null);

  if (!userSnap?.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || "Pengguna",
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      currency: "IDR",
      language: "id",
    }).catch(() => {});
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fireAuth = getFirebaseAuth();

    // If Firebase is not configured, skip auth and use demo mode
    if (!fireAuth || !isFirebaseConfigured()) {
      setProfile({
        uid: "demo",
        displayName: "Pengguna",
        email: "demo@fintrack.ai",
        photoURL: null,
      });
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(fireAuth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        await syncUserToFirestore(firebaseUser);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(fireAuth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const fireAuth = getFirebaseAuth();
      if (!fireAuth) throw new Error("Firebase not configured");
      const cred = await createUserWithEmailAndPassword(
        fireAuth,
        email,
        password,
      );
      await updateProfile(cred.user, { displayName: name });
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fireAuth, provider);
  }, []);

  const signOut = useCallback(async () => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) return;
    await firebaseSignOut(fireAuth);
    setProfile(null);
  }, []);

  const updateUserProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      const fireAuth = getFirebaseAuth();
      if (!fireAuth?.currentUser) return;
      await updateProfile(fireAuth.currentUser, data);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      const fireDb = getFirebaseDb();
      if (fireDb) {
        const userRef = doc(fireDb, "users", fireAuth.currentUser.uid);
        await setDoc(userRef, data, { merge: true }).catch(() => {});
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateUserProfile,
    }),
    [
      user,
      profile,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
