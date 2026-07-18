import "server-only";

import { createClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

/** Service-role Supabase client — server-only, bypasses RLS. Never import this from client components. */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured to use document storage");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function buildStoragePath(scope: { loanRequestId?: string; lenderId?: string }, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = scope.loanRequestId
    ? `loan-requests/${scope.loanRequestId}`
    : scope.lenderId
      ? `lenders/${scope.lenderId}`
      : "misc";
  return `${prefix}/${Date.now()}-${safeName}`;
}

export async function uploadDocument(path: string, file: Buffer, contentType: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedDocumentUrl(path: string, expiresInSeconds = 60 * 10) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(path: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  if (error) throw error;
}
