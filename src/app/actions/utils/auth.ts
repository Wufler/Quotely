import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function verifyAuthentication(userId?: string): Promise<{ authenticated: boolean; userId: string | null }> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user?.id) {
        return { authenticated: false, userId: null }
    }

    if (userId && session.user.id !== userId) {
        return { authenticated: false, userId: null }
    }

    return { authenticated: true, userId: session.user.id }
}
