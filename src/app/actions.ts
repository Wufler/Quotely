'use server'

import { checkBotId } from 'botid/server'
import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const RATE_LIMIT_WINDOW = 5 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 3

const rateLimitStore = new Map<string, number[]>()

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now()
    const userTimestamps = rateLimitStore.get(userId) || []

    const recentTimestamps = userTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)

    if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        const oldestTimestamp = recentTimestamps[0]
        const retryAfter = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW - now) / 1000)
        return { allowed: false, retryAfter }
    }

    recentTimestamps.push(now)
    rateLimitStore.set(userId, recentTimestamps)

    return { allowed: true }
}

export async function getData(cursor?: number, limit: number = 12) {
    const quotes = await prisma.quotes.findMany({
        take: limit + 1,
        ...(cursor && {
            skip: 1,
            cursor: {
                id: cursor
            }
        }),
        include: {
            user: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const hasMore = quotes.length > limit
    const data = hasMore ? quotes.slice(0, -1) : quotes
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return {
        data,
        nextCursor,
        hasMore
    }
}

export async function saveData(quote: string, author: string, id: string) {
    const verification = await checkBotId();

    if (verification.isBot) {
        throw new Error('Access denied');
    }

    const rateCheck = checkRateLimit(id)
    if (!rateCheck.allowed) {
        throw new Error(`Too many quotes created. Please try again later.`);
    }

    try {
        const newQuote = await prisma.quotes.create({
            data: {
                author,
                quote,
                userId: id
            },
            include: {
                user: true
            }
        })
        revalidatePath('/')
        return newQuote
    } catch (error) {
        console.log(error)
        return null
    }
}

export async function deleteData(id: number) {
    const verification = await checkBotId();

    if (verification.isBot) {
        throw new Error('Access denied');
    }

    try {
        await prisma.quotes.delete({
            where: { id }
        })
        return 'Deleted Quote'
    } catch (error) {
        console.log(error)
        return 'Something went wrong'
    }
}

export async function incrementLikes(id: number, userId: string) {
    const verification = await checkBotId();

    if (verification.isBot) {
        throw new Error('Access denied');
    }

    try {
        return await prisma.$transaction(async (tx) => {
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
    const verification = await checkBotId();

    if (verification.isBot) {
        throw new Error('Access denied');
    }

    try {
        return await prisma.$transaction(async (tx) => {
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

export async function getFilteredData(filter: FilterParams, sort: SortOption, cursor?: number, limit: number = 12) {
    const query: Prisma.QuotesFindManyArgs = {
        take: limit + 1,
        ...(cursor && {
            skip: 1,
            cursor: {
                id: cursor
            }
        }),
        include: {
            user: true
        },
        where: {},
        orderBy: {}
    }

    switch (filter.filterType) {
        case 'likes':
            query.where = { likes: { gte: 0 } }
            break
        case 'dislikes':
            query.where = { likes: { lt: 0 } }
            break
        case 'author':
            if (filter.authorFilter?.trim()) {
                query.where = {
                    author: {
                        contains: filter.authorFilter.trim(),
                        mode: 'insensitive'
                    }
                }
            }
            break
    }

    switch (sort) {
        case 'new':
            query.orderBy = { createdAt: 'desc' }
            break
        case 'old':
            query.orderBy = { createdAt: 'asc' }
            break
        case 'most':
            query.orderBy = { likes: 'desc' }
            break
        case 'least':
            query.orderBy = { likes: 'asc' }
            break
        default:
            query.orderBy = { createdAt: 'desc' }
    }

    const quotes = await prisma.quotes.findMany(query)
    const hasMore = quotes.length > limit
    const data = hasMore ? quotes.slice(0, -1) : quotes
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return {
        data,
        nextCursor,
        hasMore
    }
}

export async function deleteAccount(userId: string) {
    const verification = await checkBotId();

    if (verification.isBot) {
        throw new Error('Access denied');
    }

    await prisma.user.delete({
        where: { id: userId }
    })
}