'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

export type Location = Database['public']['Tables']['locations']['Row']

export async function getLocations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_requirements (count)
    `)
    .order('business_type', { ascending: true })
    .order('location_name', { ascending: true })

  if (error) throw error
  return data as (Location & { location_requirements: { count: number }[] })[]
}

export async function getLocation(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Location
}

export async function createLocation(formData: FormData) {
  const supabase = await createClient()

  const location = {
    business_type: formData.get('business_type') as string,
    location_name: formData.get('location_name') as string,
    code: formData.get('code') as string,
    is_active: formData.get('is_active') === 'true',
  }

  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('このコードは既に使用されています')
    }
    throw error
  }

  revalidatePath('/locations')
  return data as Location
}

export async function updateLocation(id: string, formData: FormData) {
  const supabase = await createClient()

  const location = {
    business_type: formData.get('business_type') as string,
    location_name: formData.get('location_name') as string,
    is_active: formData.get('is_active') === 'true',
  }

  const { data, error } = await supabase
    .from('locations')
    .update(location)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/locations')
  revalidatePath(`/locations/${id}`)
  return data as Location
}

export async function deleteLocation(id: string) {
  const supabase = await createClient()

  // 配属箇所が使用中かチェック（シフト割り当て、要件設定など）
  const { count: requirementsCount } = await supabase
    .from('location_requirements')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', id)

  if (requirementsCount && requirementsCount > 0) {
    throw new Error('この配属箇所には要件設定があるため削除できません。先に要件を削除してください。')
  }

  const { count: shiftsCount } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', id)

  if (shiftsCount && shiftsCount > 0) {
    throw new Error('この配属箇所はシフトに割り当てられているため削除できません')
  }

  const { error } = await supabase.from('locations').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/locations')
}
