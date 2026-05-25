import crypto from 'crypto'

const ITERATIONS = 100000
const KEY_LEN    = 32
const DIGEST     = 'sha256'

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, key) => {
      if (err) reject(err)
      else resolve(key.toString('hex'))
    })
  })
}

async function getDB() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    const { createServiceClient } = await import('./supabase')
    return createServiceClient()
  } catch {
    return null
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const db = await getDB()
    
    // No Supabase configured → accept default "admin"
    if (!db) return password === 'admin'

    const { data } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .maybeSingle()

    // No hash stored yet → accept default "admin"
    if (!data?.value) return password === 'admin'

    // Stored as "salt:hash"
    const [salt, storedHash] = data.value.split(':')
    if (!salt || !storedHash) return password === 'admin'

    const hash = await hashPassword(password, salt)
    return hash === storedHash
  } catch {
    // Any error → fall back to default password
    return password === 'admin'
  }
}

export async function savePassword(newPassword: string): Promise<void> {
  const salt = crypto.randomUUID()
  const hash = await hashPassword(newPassword, salt)
  const value = `${salt}:${hash}`

  const db = await getDB()
  if (!db) throw new Error('Database not configured')

  await db.from('app_settings').upsert(
    { key: 'admin_password_hash', value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}
