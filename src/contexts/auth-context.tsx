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
  signInWithCustomToken,
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
  phoneNumber?: string | null;
  createdAt?: Date;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithToken: (customToken: string) => Promise<void>;
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
      phoneNumber: user.phoneNumber || null,
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

    // If Firebase is not configured, stay in unauthenticated state
    if (!fireAuth || !isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(fireAuth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load additional profile data from Firestore
        const fireDb = getFirebaseDb();
        let phoneNumber: string | null = null;
        let firestorePhotoURL: string | null = null;
        if (fireDb) {
          const userDoc = await getDoc(
            doc(fireDb, "users", firebaseUser.uid),
          ).catch(() => null);
          if (userDoc?.exists()) {
            phoneNumber = userDoc.data()?.phoneNumber || null;
            firestorePhotoURL = userDoc.data()?.photoURL || null;
          }
        }

        setProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          // Prefer Firestore photoURL (Cloudflare R2) over Auth photoURL
          photoURL: firestorePhotoURL || firebaseUser.photoURL,
          phoneNumber: phoneNumber || firebaseUser.phoneNumber,
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

  const signInWithGoogleFn = useCallback(async () => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fireAuth, provider);
  }, []);

  const signInWithTokenFn = useCallback(async (customToken: string) => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) throw new Error("Firebase not configured");
    await signInWithCustomToken(fireAuth, customToken);
  }, []);

  const signOutFn = useCallback(async () => {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth) return;
    await firebaseSignOut(fireAuth);
    setProfile(null);
  }, []);

  const updateUserProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      const fireAuth = getFirebaseAuth();
      if (!fireAuth?.currentUser) return;

      // Only send non-empty fields to Firebase Auth updateProfile
      const authUpdate: { displayName?: string; photoURL?: string } = {};
      if (data.displayName !== undefined)
        authUpdate.displayName = data.displayName;
      if (data.photoURL !== undefined)
        authUpdate.photoURL = data.photoURL || "";

      await updateProfile(fireAuth.currentUser, authUpdate);

      // Update local profile state
      setProfile((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        if (data.displayName !== undefined)
          updated.displayName = data.displayName;
        if (data.photoURL !== undefined)
          updated.photoURL = data.photoURL || null;
        return updated;
      });

      // Sync to Firestore
      const fireDb = getFirebaseDb();
      if (fireDb) {
        const userRef = doc(fireDb, "users", fireAuth.currentUser.uid);
        const firestoreData: Record<string, unknown> = {};
        if (data.displayName !== undefined)
          firestoreData.displayName = data.displayName;
        if (data.photoURL !== undefined)
          firestoreData.photoURL = data.photoURL || null;
        await setDoc(userRef, firestoreData, { merge: true }).catch(() => {});
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
      signInWithGoogle: signInWithGoogleFn,
      signInWithToken: signInWithTokenFn,
      signOut: signOutFn,
      updateUserProfile,
    }),
    [
      user,
      profile,
      isLoading,
      signIn,
      signInWithGoogleFn,
      signInWithTokenFn,
      signOutFn,
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
