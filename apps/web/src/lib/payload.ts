import config from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

// Singleton — avoids re-initializing on every call in the same request
let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null

export async function getPayload() {
  if (!cached) {
    cached = await getPayloadInstance({ config })
  }
  return cached
}

export function resetPayloadCache() {
  cached = null
}
