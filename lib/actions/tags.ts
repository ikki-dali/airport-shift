'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

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

  if (error) throw error
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

  if (error) throw error
  return data as Tag
}

/**
 * タグを作成
 */
export async function createTag(formData: FormData) {
  const supabase = await createClient()

  const tag: TagInsert = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
  }

  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // unique violation
      throw new Error('このタグ名は既に使用されています')
    }
    throw error
  }

  revalidatePath('/tags')
  return data as Tag
}

/**
 * タグを更新
 */
export async function updateTag(id: string, formData: FormData) {
  const supabase = await createClient()

  const tag: TagUpdate = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
  }

  const { data, error } = await supabase
    .from('tags')
    .update(tag)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('このタグ名は既に使用されています')
    }
    throw error
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
    throw new Error('このタグは使用中のため削除できません')
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) throw error

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
