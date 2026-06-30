import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fshsfanxmsdeomujolqj.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHNmYW54bXNkZW9tdWpvbHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTIyODEsImV4cCI6MjA5ODMyODI4MX0.Eyo45pZYS-1aBgSpjic8hTcWtd2Yehd89KFoxJj4uDU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export interface Latest {
  series_name: string; series_code: number
  reference_date: string; value: number; updated_at: string
}
export interface Monthly {
  id: number; series_name: string; year: number; month: number
  avg_value: number; min_value: number; max_value: number; last_value: number
}
export interface Annual {
  id: number; series_name: string; year: number
  avg_value: number; min_value: number; max_value: number; acum_value: number
}

export async function fetchLatest(): Promise<Latest[]> {
  const { data, error } = await supabase.from('econ_latest').select('*')
  if (error) throw error
  return data ?? []
}
export async function fetchMonthly(): Promise<Monthly[]> {
  const { data, error } = await supabase.from('econ_monthly').select('*').order('year').order('month')
  if (error) throw error
  return data ?? []
}
export async function fetchAnnual(): Promise<Annual[]> {
  const { data, error } = await supabase.from('econ_annual').select('*').order('year')
  if (error) throw error
  return data ?? []
}
