// All database access lives here. Swap this file to change backends.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function check({ data, error }) {
  if (error) {
    throw new Error(error.code === '23505' ? 'That meal is already in your list.' : error.message)
  }
  return data
}

export async function getMeals() {
  return check(await supabase.from('meals').select('id, name').order('name'))
}

export async function addMeal(name) {
  return check(await supabase.from('meals').insert({ name }).select('id, name').single())
}

export async function updateMeal(id, name) {
  return check(await supabase.from('meals').update({ name }).eq('id', id).select('id, name').single())
}

export async function deleteMeal(id) {
  return check(await supabase.from('meals').delete().eq('id', id))
}
