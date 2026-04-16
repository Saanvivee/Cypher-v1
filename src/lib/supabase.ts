import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const edgeFunctionUrl = (fn: string) =>
  `${supabaseUrl}/functions/v1/${fn}`;

export async function callEdgeFunction<T>(
  fn: string,
  body: unknown
): Promise<T> {
  const res = await fetch(edgeFunctionUrl(fn), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edge function ${fn} failed: ${err}`);
  }
  return res.json() as Promise<T>;
}
