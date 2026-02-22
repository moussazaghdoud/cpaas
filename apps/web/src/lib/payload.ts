import config from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

// Singleton — avoids re-initializing on every call in the same request
let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null
let initFailed = false

export async function getPayload() {
  if (initFailed) throw new Error('Payload init previously failed — database unavailable')
  if (!cached) {
    try {
      cached = await getPayloadInstance({ config })
    } catch (err) {
      initFailed = true
      throw err
    }
  }
  return cached
}
