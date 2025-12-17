import { headers } from 'next/headers'

export const RATE_LIMIT_WINDOW = 5 * 60 * 1000
export const RATE_LIMIT_LIKES_WINDOW = 1 * 60 * 1000
export const RATE_LIMIT_MAX_QUOTES = 2
export const RATE_LIMIT_MAX_LIKES = 20

const rateLimitStore = new Map<string, number[]>()

async function getClientIp(): Promise<string> {
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')

    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    if (realIp) {
        return realIp
    }
    return 'unknown'
}

export async function checkRateLimit(userId: string, maxRequests: number = RATE_LIMIT_MAX_QUOTES, window: number = RATE_LIMIT_WINDOW): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now()
    const ip = await getClientIp()

    const ipKey = `ip:${ip}`
    const ipTimestamps = rateLimitStore.get(ipKey) || []
    const recentIpTimestamps = ipTimestamps.filter(timestamp => now - timestamp < window)

    if (recentIpTimestamps.length >= maxRequests) {
        const oldestTimestamp = recentIpTimestamps[0]
        const retryAfter = Math.ceil((oldestTimestamp + window - now) / 1000)
        return { allowed: false, retryAfter }
    }

    const userKey = `${ip}:${userId}`
    const userTimestamps = rateLimitStore.get(userKey) || []
    const recentUserTimestamps = userTimestamps.filter(timestamp => now - timestamp < window)

    if (recentUserTimestamps.length >= maxRequests) {
        const oldestTimestamp = recentUserTimestamps[0]
        const retryAfter = Math.ceil((oldestTimestamp + window - now) / 1000)
        return { allowed: false, retryAfter }
    }

    recentIpTimestamps.push(now)
    rateLimitStore.set(ipKey, recentIpTimestamps)

    recentUserTimestamps.push(now)
    rateLimitStore.set(userKey, recentUserTimestamps)

    return { allowed: true }
}
