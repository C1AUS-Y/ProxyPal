// the name to show for the logged-in user (set at sign-up, falls back to the email)
export function getDisplayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
}