/**
 * Centralized environment variable management
 * - No hardcoded fallbacks
 * - Fails fast on missing required vars
 * - Sanitized logging (no secrets)
 */

let logged = false

function read(name: string, required = true): string {
  const v = process.env[name]
  if (required && (!v || !v.trim())) {
    console.error(`[EnvError] Missing required env var: ${name}`)
    throw new Error(`Missing required env var: ${name}`)
  }
  return (v || '').trim()
}

/**
 * Get Supabase server URL
 * Prefers SUPABASE_INTERNAL_URL (for Docker/internal access)
 * Falls back to NEXT_PUBLIC_SUPABASE_URL (for public/gateway access)
 * Throws if neither is set
 */
export function getSupabaseServerUrl(): string {
  const internal = read('SUPABASE_INTERNAL_URL', false)
  const pub = read('NEXT_PUBLIC_SUPABASE_URL', false)
  const url = internal || pub

  if (!url) {
    throw new Error(
      'No Supabase URL found. Set SUPABASE_INTERNAL_URL (preferred on server) or NEXT_PUBLIC_SUPABASE_URL.'
    )
  }

  if (!logged) {
    try {
      const u = new URL(url)
      const origin = `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`
      console.info(
        `[Supabase] Server using ${internal ? 'internal' : 'public'} URL: ${origin}`
      )
    } catch {
      console.warn('[Supabase] Supplied URL is not a valid URL string')
    }
    logged = true
  }

  return url
}

/**
 * Get a required environment variable
 */
export function getRequired(name: string): string {
  return read(name, true)
}

/**
 * Get an optional environment variable
 */
export function getOptional(name: string): string | undefined {
  const v = read(name, false)
  return v || undefined
}
