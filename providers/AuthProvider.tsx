"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { SHOP_ID } from "@/lib/constants";
import type { AppUser, UserRole } from "@/lib/types";
import { toDate } from "@/lib/firestore/helpers";

async function ensureUserProfile(user: User): Promise<AppUser> {
  const existing = await fetchProfile(user.uid);
  if (existing) return existing;

  const db = getFirebaseDb();
  const displayName =
    user.displayName || user.email?.split("@")[0] || "Shop Owner";
  await setDoc(doc(db, COLLECTIONS.users, user.uid), {
    uid: user.uid,
    email: user.email ?? "",
    displayName,
    role: "owner",
    shopId: SHOP_ID,
    createdAt: serverTimestamp(),
  });

  return {
    id: user.uid,
    uid: user.uid,
    role: "owner",
    email: user.email ?? undefined,
    displayName,
    shopId: SHOP_ID,
    createdAt: new Date(),
  };
}

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  configured: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name: string) => Promise<void>;
  sendPhoneOtp: (
    phone: string,
    recaptchaContainerId: string
  ) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(uid: string): Promise<AppUser | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    uid,
    role: data.role as UserRole,
    email: data.email,
    phone: data.phone,
    displayName: data.displayName,
    workerId: data.workerId,
    shopId: data.shopId,
    createdAt: toDate(data.createdAt),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const auth = getFirebaseAuth();

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 6000);

    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (cancelled) return;
        setUser(u);
        if (u) {
          try {
            let p = await fetchProfile(u.uid);
            if (!p) {
              try {
                p = await ensureUserProfile(u);
              } catch {
                p = null;
              }
            }
            if (!cancelled) setProfile(p);
          } catch {
            if (!cancelled) setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, [configured]);

  const signInEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const p = await ensureUserProfile(cred.user);
      setProfile(p);
      setUser(cred.user);
    } catch {
      /* onAuthStateChanged will retry */
    }
  };

  const signUpEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const db = getFirebaseDb();
    await setDoc(doc(db, COLLECTIONS.users, cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName: name,
      role: "owner",
      shopId: SHOP_ID,
      createdAt: serverTimestamp(),
    });
  };

  const sendPhoneOtp = async (
    phone: string,
    recaptchaContainerId: string
  ) => {
    const auth = getFirebaseAuth();
    const { RecaptchaVerifier } = await import("firebase/auth");
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: "invisible",
    });
    const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    return signInWithPhoneNumber(auth, formatted, verifier);
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        configured,
        signInEmail,
        signUpEmail,
        sendPhoneOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
