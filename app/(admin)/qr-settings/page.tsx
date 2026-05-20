"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { shopQuery } from "@/lib/firestore/helpers";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { QrLink } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { APP_URL } from "@/lib/firebase/config";
import { generateToken } from "@/lib/utils";
import { SHOP_ID } from "@/lib/constants";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export default function QrSettingsPage() {
  const [links, setLinks] = useState<QrLink[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [label, setLabel] = useState("Shop Counter");
  const [type, setType] = useState<QrLink["type"]>("shop");

  const load = () => {
    shopQuery<QrLink>(COLLECTIONS.qrLinks).then(setLinks);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    links.forEach(async (link) => {
      const url = `${APP_URL}/c/${link.token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
      setQrImages((prev) => ({ ...prev, [link.token]: dataUrl }));
    });
  }, [links]);

  const createLink = async () => {
    const token = generateToken();
    const db = getFirebaseDb();
    await setDoc(doc(db, COLLECTIONS.qrLinks, token), {
      shopId: SHOP_ID,
      token,
      type,
      label,
      active: true,
      createdAt: serverTimestamp(),
    });
    setLabel("Shop Counter");
    load();
  };

  const seedDefault = async () => {
    const db = getFirebaseDb();
    await setDoc(doc(db, COLLECTIONS.qrLinks, "rattan-shop"), {
      shopId: SHOP_ID,
      token: "rattan-shop",
      type: "shop",
      label: "Main Shop QR",
      active: true,
      createdAt: serverTimestamp(),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">QR Codes</h1>
        <p className="text-zinc-500 text-sm">
          Print on visiting cards, invoices, worker IDs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create QR Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QrLink["type"])}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white"
              >
                <option value="shop" className="bg-zinc-900">Shop</option>
                <option value="worker" className="bg-zinc-900">Worker</option>
                <option value="invoice" className="bg-zinc-900">Invoice</option>
                <option value="site" className="bg-zinc-900">Site</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={createLink}>Generate QR</Button>
            <Button variant="secondary" onClick={seedDefault}>
              Seed Default Shop QR
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Card key={link.id}>
            <CardContent className="pt-5 text-center">
              <p className="font-medium text-white mb-1">{link.label}</p>
              <p className="text-xs text-zinc-500 mb-4 capitalize">{link.type}</p>
              {qrImages[link.token] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImages[link.token]}
                  alt="QR"
                  className="mx-auto rounded-lg bg-white p-2"
                />
              )}
              <p className="text-xs text-violet-400 mt-3 break-all">
                {APP_URL}/c/{link.token}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
