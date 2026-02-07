import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Get the current authenticated user from Supabase.
 * Returns null if not authenticated.
 */
export async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  }
}

/**
 * Sign out the current user and redirect to login.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
