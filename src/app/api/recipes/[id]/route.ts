import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ recipe: data })
}

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const { name, ingredients, instructions, image_url } = payload ?? {}

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof name === 'string') updates.name = name
  if (Array.isArray(ingredients)) updates.ingredients = ingredients
  if (typeof instructions === 'string') updates.instructions = instructions
  if (image_url === null || typeof image_url === 'string') updates.image_url = image_url

  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ recipe: data })
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
