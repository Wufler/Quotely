'use server'

import { checkBotId } from 'botid/server'
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyAuthentication } from './utils/auth'

export async function deleteAccount(userId: string) {
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
    }

    const verification = await checkBotId();
    if (verification.isBot) {
        throw new Error('Access denied');
    }

    const authCheck = await verifyAuthentication(userId);
    if (!authCheck.authenticated || authCheck.userId !== userId) {
        throw new Error('Unauthorized');
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/');
    } catch (error) {
        console.error('Error deleting account:', error);
        throw new Error('Failed to delete account');
    }
}
