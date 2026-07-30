import { supabase } from "@/integrations/supabase/client";

export interface CloudTransfer {
  id: string;
  date: string;
  recipientName: string;
  amountSent: number;
  currency: string;
  amountReceived: number;
  receivedCurrency: string;
  paymentMethod: string;
  reference: string;
}

export interface CloudNote {
  id: string;
  date: string;
  title: string;
  body: string;
}

export async function fetchCloud(userId: string) {
  const [tRes, nRes] = await Promise.all([
    supabase.from("transfers").select("*").eq("user_id", userId),
    supabase.from("notes").select("*").eq("user_id", userId),
  ]);

  const transfers: CloudTransfer[] = (tRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    recipientName: r.recipient_name,
    amountSent: Number(r.amount_sent),
    currency: r.sent_currency,
    amountReceived: Number(r.amount_received),
    receivedCurrency: r.received_currency,
    paymentMethod: r.payment_method,
    reference: r.reference,
  }));

  const notes: CloudNote[] = (nRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
  }));

  return { transfers, notes, error: tRes.error ?? nRes.error };
}

export async function pushCloud(userId: string, transfers: CloudTransfer[], notes: CloudNote[]) {
  const transferRows = transfers.map((r) => ({
    id: r.id,
    user_id: userId,
    date: r.date ?? "",
    recipient_name: r.recipientName ?? "",
    amount_sent: Number(r.amountSent) || 0,
    sent_currency: r.currency ?? "SAR",
    amount_received: Number(r.amountReceived) || 0,
    received_currency: r.receivedCurrency ?? "BDT",
    payment_method: r.paymentMethod ?? "",
    reference: r.reference ?? "",
    updated_at: new Date().toISOString(),
  }));

  const noteRows = notes.map((n) => ({
    id: n.id,
    user_id: userId,
    date: n.date ?? "",
    title: n.title ?? "",
    body: n.body ?? "",
    updated_at: new Date().toISOString(),
  }));

  const ops: Promise<unknown>[] = [];
  if (transferRows.length) ops.push(supabase.from("transfers").upsert(transferRows, { onConflict: "user_id,id" }));
  if (noteRows.length) ops.push(supabase.from("notes").upsert(noteRows, { onConflict: "user_id,id" }));

  const tIds = transfers.map((r) => r.id);
  const nIds = notes.map((n) => n.id);
  const listFor = (ids: string[]) => `(${ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",")})`;

  let tDel = supabase.from("transfers").delete().eq("user_id", userId);
  if (tIds.length) tDel = tDel.not("id", "in", listFor(tIds));
  ops.push(tDel);

  let nDel = supabase.from("notes").delete().eq("user_id", userId);
  if (nIds.length) nDel = nDel.not("id", "in", listFor(nIds));
  ops.push(nDel);

  await Promise.all(ops);
}
