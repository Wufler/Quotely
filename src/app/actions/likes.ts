'use server'

import { checkBotId } from 'botid/server'
import prisma from "@/lib/prisma"
import { verifyAuthentication } from './utils/auth'
import { checkRateLimit, RATE_LIMIT_LIKES_WINDOW, RATE_LIMIT_MAX_LIKES } from './utils/rate-limit'

export async function incrementLikes(id: number, userId: string) {
    if (!id || id < 1 || !Number.isInteger(id)) {
        throw new Error('Invalid quote ID');
    }
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

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAnonymous: true }
    });

    if (user?.isAnonymous) {
        throw new Error('Anonymous users cannot like quotes. Please sign in with Google or GitHub.');
    }

    const rateCheck = await checkRateLimit(userId, RATE_LIMIT_MAX_LIKES, RATE_LIMIT_LIKES_WINDOW);
    if (!rateCheck.allowed) {
        throw new Error('Too many like actions. Please slow down.');
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const quoteExists = await tx.quotes.findUnique({
                where: { id },
                select: { id: true }
            });

            if (!quoteExists) {
                throw new Error('Quote not found');
            }

            const existingVote = await tx.quoteLike.findUnique({
                where: {
                    quoteId_userId: {
                        quoteId: id,
                        userId: userId
                    }
                }
            });

            if (existingVote) {
                if (existingVote.value === 1) {
                    await tx.quoteLike.delete({
                        where: { id: existingVote.id }
                    });

                    const updatedQuote = await tx.quotes.update({
                        where: { id },
                        data: { likes: { decrement: 1 } }
                    });
                    return updatedQuote;
                } else {
                    await tx.quoteLike.update({
                        where: { id: existingVote.id },
                        data: { value: 1 }
                    });

                    const updatedQuote = await tx.quotes.update({
                        where: { id },
                        data: { likes: { increment: 2 } }
                    });
                    return updatedQuote;
                }
            } else {
                await tx.quoteLike.create({
                    data: {
                        quoteId: id,
                        userId: userId,
                        value: 1
                    }
                });

                const updatedQuote = await tx.quotes.update({
                    where: { id },
                    data: { likes: { increment: 1 } }
                });
                return updatedQuote;
            }
        });
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function decrementLikes(id: number, userId: string) {
    if (!id || id < 1 || !Number.isInteger(id)) {
        throw new Error('Invalid quote ID');
    }
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

    // Block anonymous users from disliking
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAnonymous: true }
    });

    if (user?.isAnonymous) {
        throw new Error('Anonymous users cannot dislike quotes. Please sign in with Google or GitHub.');
    }

    const rateCheck = await checkRateLimit(userId, RATE_LIMIT_MAX_LIKES, RATE_LIMIT_LIKES_WINDOW);
    if (!rateCheck.allowed) {
        throw new Error('Too many like actions. Please slow down.');
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const quoteExists = await tx.quotes.findUnique({
                where: { id },
                select: { id: true }
            });

            if (!quoteExists) {
                throw new Error('Quote not found');
            }

            const existingVote = await tx.quoteLike.findUnique({
                where: {
                    quoteId_userId: {
                        quoteId: id,
                        userId: userId
                    }
                }
            });

            if (existingVote) {
                if (existingVote.value === -1) {
                    await tx.quoteLike.delete({
                        where: { id: existingVote.id }
                    });

                    const updatedQuote = await tx.quotes.update({
                        where: { id },
                        data: { likes: { increment: 1 } }
                    });
                    return updatedQuote;
                } else {
                    await tx.quoteLike.update({
                        where: { id: existingVote.id },
                        data: { value: -1 }
                    });

                    const updatedQuote = await tx.quotes.update({
                        where: { id },
                        data: { likes: { decrement: 2 } }
                    });
                    return updatedQuote;
                }
            } else {
                await tx.quoteLike.create({
                    data: {
                        quoteId: id,
                        userId: userId,
                        value: -1
                    }
                });

                const updatedQuote = await tx.quotes.update({
                    where: { id },
                    data: { likes: { decrement: 1 } }
                });
                return updatedQuote;
            }
        });
    } catch (error) {
        console.log(error);
        return null;
    }
}
