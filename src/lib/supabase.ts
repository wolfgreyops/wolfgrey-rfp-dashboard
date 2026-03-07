import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RFPOpportunity {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  source_name: string;
  source_category: string;
  apparel_type: string[] | null;
  estimated_value: string | null;
  posted_date: string | null;
  due_date: string | null;
  discovered_at: string;
  state: string | null;
  city: string | null;
  organization_name: string | null;
  status: string;
  notes: string | null;
  source_id: string | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

/** Check if an RFP is past due by due_date field or deadline parsed from title */
export function isPastDue(o: RFPOpportunity, today: string): boolean {
  if (o.due_date) return o.due_date < today;
  // Parse "Deadline Month Day,Year" or "Deadline Month Day, Year" from title
  const match = o.title.match(/Deadline\s+([A-Z][a-z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (match) {
    const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0] < today;
  }
  return false;
}

export interface SearchRun {
  id: string;
  source: string;
  search_params: Record<string, unknown>;
  status: string;
  opportunities_found: number | null;
  new_opportunities: number | null;
  email_sent: boolean;
  completed_at: string | null;
  created_at: string;
}
