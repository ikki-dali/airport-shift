'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type LocationRequirement = Database['public']['Tables']['location_requirements']['Row']
type LocationRequirementWithDutyCode = LocationRequirement & {
  duty_codes: {
    id: string
    code: string
    start_time: string | null
    end_time: string | null
    category: string
  } | null
}

export async function getLocationRequirements(locationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('location_requirements')
    .select(`
      *,
      duty_codes (
        id,
        code,
        start_time,
        end_time,
        category
      )
    `)
    .eq('location_id', locationId)
    .order('duty_code_id')

  if (error) throw error
  return data as LocationRequirementWithDutyCode[]
}

export async function getLocationRequirement(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('location_requirements')
    .select(`
      *,
      duty_codes (
        id,
        code,
        start_time,
        end_time,
        category
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as LocationRequirementWithDutyCode
}

export async function createLocationRequirement(formData: FormData) {
  const supabase = await createClient()

  const patternType = formData.get('pattern_type') as string
  const requiredTags = formData.getAll('required_tags') as string[]

  const requirement = {
    location_id: formData.get('location_id') as string,
    duty_code_id: formData.get('duty_code_id') as string,
    required_staff_count: parseInt(formData.get('required_staff_count') as string) || 0,
    required_responsible_count: parseInt(formData.get('required_responsible_count') as string) || 0,
    required_tags: requiredTags.length > 0 ? requiredTags : [],
    day_of_week:
      patternType === 'day_of_week'
        ? parseInt(formData.get('day_of_week') as string)
        : null,
    specific_date:
      patternType === 'specific_date'
        ? (formData.get('specific_date') as string)
        : null,
  }

  const { data, error } = await supabase
    .from('location_requirements')
    .insert(requirement)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/locations/${requirement.location_id}/requirements`)
  return data as LocationRequirement
}

export async function updateLocationRequirement(id: string, formData: FormData) {
  const supabase = await createClient()

  const patternType = formData.get('pattern_type') as string
  const requiredTags = formData.getAll('required_tags') as string[]

  const requirement = {
    duty_code_id: formData.get('duty_code_id') as string,
    required_staff_count: parseInt(formData.get('required_staff_count') as string) || 0,
    required_responsible_count: parseInt(formData.get('required_responsible_count') as string) || 0,
    required_tags: requiredTags.length > 0 ? requiredTags : [],
    day_of_week:
      patternType === 'day_of_week'
        ? parseInt(formData.get('day_of_week') as string)
        : null,
    specific_date:
      patternType === 'specific_date'
        ? (formData.get('specific_date') as string)
        : null,
  }

  const { data, error } = await supabase
    .from('location_requirements')
    .update(requirement)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // location_idを取得してrevalidate
  const locationId = data.location_id
  revalidatePath(`/locations/${locationId}/requirements`)
  return data as LocationRequirement
}

export async function deleteLocationRequirement(id: string, locationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('location_requirements')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath(`/locations/${locationId}/requirements`)
}
