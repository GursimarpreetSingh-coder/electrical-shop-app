import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import { COLLECTIONS } from "./collections";
import { SHOP_ID } from "@/lib/constants";
import { generateReferenceCode } from "@/lib/utils";
import type {
  Customer,
  ServiceRequest,
  RequestSource,
  ProblemType,
} from "@/lib/types";

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export function mapDoc<T>(id: string, data: DocumentData): T {
  const mapped = { ...data, id } as Record<string, unknown>;
  for (const key of ["createdAt", "updatedAt", "date"]) {
    if (mapped[key]) mapped[key] = toDate(mapped[key]);
  }
  return mapped as T;
}

export async function getCollection<T>(
  name: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, name), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<T>(d.id, d.data()));
}

export async function getDocById<T>(
  name: string,
  id: string
): Promise<T | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, name, id));
  if (!snap.exists()) return null;
  return mapDoc<T>(snap.id, snap.data());
}

export async function createDoc<T extends DocumentData>(
  name: string,
  data: T
): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, name), {
    ...data,
    shopId: SHOP_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocById(
  name: string,
  id: string,
  data: DocumentData
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeDoc(name: string, id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, name, id));
}

export async function findCustomerByPhone(
  phone: string
): Promise<Customer | null> {
  const customers = await getCollection<Customer>(COLLECTIONS.customers, [
    where("shopId", "==", SHOP_ID),
    where("phone", "==", phone),
    limit(1),
  ]);
  return customers[0] ?? null;
}

export async function upsertCustomer(data: {
  name: string;
  phone: string;
  address: string;
}): Promise<string> {
  const existing = await findCustomerByPhone(data.phone);
  if (existing) {
    await updateDocById(COLLECTIONS.customers, existing.id, {
      name: data.name,
      address: data.address,
    });
    return existing.id;
  }
  return createDoc(COLLECTIONS.customers, {
    ...data,
    balance: 0,
  });
}

export async function uploadFiles(
  path: string,
  files: File[]
): Promise<string[]> {
  const storage = getFirebaseStorage();
  const urls: string[] = [];
  for (const file of files) {
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    urls.push(await getDownloadURL(storageRef));
  }
  return urls;
}

export async function submitServiceRequest(params: {
  name: string;
  phone: string;
  address: string;
  problemType: ProblemType;
  description: string;
  preferredTime?: string;
  paymentNotes?: string;
  voiceTranscript?: string;
  source: RequestSource;
  qrToken?: string;
  photoFiles?: File[];
}): Promise<{ requestId: string; referenceCode: string; customerId: string }> {
  const customerId = await upsertCustomer({
    name: params.name,
    phone: params.phone,
    address: params.address,
  });

  let photos: string[] = [];
  if (params.photoFiles?.length) {
    photos = await uploadFiles(
      `customers/requests/${Date.now()}`,
      params.photoFiles
    );
  }

  const referenceCode = generateReferenceCode();
  const requestId = await createDoc(COLLECTIONS.serviceRequests, {
    customerId,
    source: params.source,
    qrToken: params.qrToken ?? null,
    problemType: params.problemType,
    description: params.description,
    voiceTranscript: params.voiceTranscript ?? "",
    preferredTime: params.preferredTime ?? "",
    paymentNotes: params.paymentNotes ?? "",
    photos,
    status: "new",
    referenceCode,
    assignedWorkerIds: [],
  });

  return { requestId, referenceCode, customerId };
}

export async function validateQrToken(token: string) {
  const link = await getDocById<{ active: boolean; shopId: string }>(
    COLLECTIONS.qrLinks,
    token
  );
  return link?.active === true && link?.shopId === SHOP_ID;
}

export async function shopQuery<T>(name: string, extra: QueryConstraint[] = []) {
  return getCollection<T>(name, [
    where("shopId", "==", SHOP_ID),
    ...extra,
  ]);
}

export async function recentServices(limitCount = 20) {
  return shopQuery<ServiceRequest>(COLLECTIONS.serviceRequests, [
    orderBy("createdAt", "desc"),
    limit(limitCount),
  ]);
}
