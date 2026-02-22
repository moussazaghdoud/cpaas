import config from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null

export async function getPayload() {
  // Skip Payload during build (no database available)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Payload not available during build')
  }
  if (cached) return cached
  cached = await getPayloadInstance({ config })
  return cached
}
