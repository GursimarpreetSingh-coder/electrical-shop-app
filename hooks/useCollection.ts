"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import { useMemo } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { mapDoc } from "@/lib/firestore/helpers";
import { SHOP_ID } from "@/lib/constants";

export function useShopCollection<T>(
  collectionName: string,
  extraConstraints: QueryConstraint[] = [],
  depsKey = ""
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, collectionName),
        where("shopId", "==", SHOP_ID),
        ...extraConstraints
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setData(snap.docs.map((d) => mapDoc<T>(d.id, d.data())));
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
      return unsub;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    }
  }, [collectionName, depsKey]);

  return { data, loading, error };
}

const LIST_LIMIT = 80;

export function useOrderedCollection<T>(collectionName: string) {
  const constraints = useMemo(
    () => [orderBy("createdAt", "desc"), limit(LIST_LIMIT)],
    []
  );
  return useShopCollection<T>(collectionName, constraints);
}
