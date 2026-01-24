'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'
import { validateData, tagSchema } from '@/lib/validators/schemas'

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']

/**
 * 全てのタグを取得
 */
export async function getTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) handleSupabaseError(error, { action: 'getTags', entity: 'タグ' })
  return data as Tag[]
}

/**
 * タグを1件取得
 */
export async function getTag(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error, { action: 'getTag', entity: 'タグ' })
  return data as Tag
}

/**
 * タグを作成
 */
export async function createTag(formData: FormData) {
  const supabase = await createClient()

  const tag: TagInsert = validateData(tagSchema, {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
  })

  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('このタグ名は既に使用されています')
    }
    handleSupabaseError(error, { action: 'createTag', entity: 'タグ' })
  }

  revalidatePath('/tags')
  return data as Tag
}

/**
 * タグを更新
 */
export async function updateTag(id: string, formData: FormData) {
  const supabase = await createClient()

  const tag: TagUpdate = validateData(tagSchema, {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
  })

  const { data, error } = await supabase
    .from('tags')
    .update(tag)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('このタグ名は既に使用されています')
    }
    handleSupabaseError(error, { action: 'updateTag', entity: 'タグ' })
  }

  revalidatePath('/tags')
  return data as Tag
}

/**
 * タグを削除
 */
export async function deleteTag(id: string) {
  const supabase = await createClient()

  // 使用中かチェック（staff.tagsに含まれているか）
  const { data: staffWithTag } = await supabase
    .from('staff')
    .select('id, tags')
    .contains('tags', [await getTagName(id)])

  if (staffWithTag && staffWithTag.length > 0) {
    throw new ValidationError('このタグは使用中のため削除できません')
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, { action: 'deleteTag', entity: 'タグ' })

  revalidatePath('/tags')
}

/**
 * タグ名を取得（内部用）
 */
async function getTagName(id: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tags')
    .select('name')
    .eq('id', id)
    .single()

  return data?.name || ''
}
