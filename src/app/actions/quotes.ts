'use server'

import { checkBotId } from 'botid/server'
import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyAuthentication } from './utils/auth'
import { checkRateLimit } from './utils/rate-limit'
import { sanitizeString, validateQuoteInput } from './utils/validation'

export async function getData(cursor?: number, limit: number = 12, userId?: string) {
    if (limit < 1 || limit > 100) {
        throw new Error('Invalid limit parameter')
    }
    if (cursor && (cursor < 1 || !Number.isInteger(cursor))) {
        throw new Error('Invalid cursor parameter')
    }

    const quotes = await prisma.quotes.findMany({
        take: limit + 1,
        ...(cursor && {
            skip: 1,
            cursor: {
                id: cursor
            }
        }),
        include: {
            user: true,
            userLikes: userId ? {
                where: {
                    userId: userId
                }
            } : false
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

    const authCheck = await verifyAuthentication(id);
    if (!authCheck.authenticated || authCheck.userId !== id) {
        throw new Error('Unauthorized');
    }

    const validation = validateQuoteInput(quote, author);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const rateCheck = await checkRateLimit(id)
    if (!rateCheck.allowed) {
        throw new Error(`Too many quotes created. Please try again later.`);
    }

    try {
        const sanitizedQuote = sanitizeString(quote, 1000);
        const sanitizedAuthor = sanitizeString(author, 100);

        const newQuote = await prisma.quotes.create({
            data: {
                author: sanitizedAuthor,
                quote: sanitizedQuote,
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
    if (!id || id < 1 || !Number.isInteger(id)) {
        throw new Error('Invalid quote ID');
    }

    const verification = await checkBotId();
    if (verification.isBot) {
        throw new Error('Access denied');
    }

    const authCheck = await verifyAuthentication();
    if (!authCheck.authenticated || !authCheck.userId) {
        throw new Error('Unauthorized');
    }

    try {
        const quote = await prisma.quotes.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!quote) {
            throw new Error('Quote not found');
        }

        if (quote.userId !== authCheck.userId) {
            throw new Error('Unauthorized');
        }

        await prisma.quotes.delete({
            where: { id }
        })
        revalidatePath('/')
        return 'Deleted Quote'
    } catch (error) {
        console.log(error)
        return 'Something went wrong'
    }
}

export async function getFilteredData(filter: FilterParams, sort: SortOption, cursor?: number, limit: number = 12, userId?: string) {
    if (limit < 1 || limit > 100) {
        throw new Error('Invalid limit parameter');
    }
    if (cursor && (cursor < 1 || !Number.isInteger(cursor))) {
        throw new Error('Invalid cursor parameter');
    }

    if (!filter || typeof filter !== 'object') {
        throw new Error('Invalid filter parameter');
    }
    const validFilterTypes = ['likes', 'dislikes', 'author', 'all'];
    if (!validFilterTypes.includes(filter.filterType)) {
        throw new Error('Invalid filter type');
    }

    const validSortOptions = ['new', 'old', 'most', 'least', 'default'];
    if (!validSortOptions.includes(sort)) {
        throw new Error('Invalid sort option');
    }

    const query: Prisma.QuotesFindManyArgs = {
        take: limit + 1,
        ...(cursor && sort !== 'default' && {
            skip: 1,
            cursor: {
                id: cursor
            }
        }),
        include: {
            user: true,
            userLikes: userId ? {
                where: {
                    userId: userId
                }
            } : false
        },
        where: {},
        orderBy: {}
    }

    switch (filter.filterType) {
        case 'likes':
            query.where = { likes: { gt: 0 } }
            break
        case 'dislikes':
            query.where = { likes: { lt: 0 } }
            break
        case 'author':
            if (filter.authorFilter?.trim()) {
                const sanitizedAuthor = sanitizeString(filter.authorFilter, 100);
                query.where = {
                    author: {
                        contains: sanitizedAuthor,
                        mode: 'insensitive'
                    }
                }
            }
            break
    }

    if (sort === 'default') {
        query.orderBy = { id: 'asc' }
        delete query.take
        delete query.cursor

        const allQuotes = await prisma.quotes.findMany(query)

        const seed = JSON.stringify(filter)
        const seededRandom = (index: number) => {
            let hash = 0
            for (let i = 0; i < seed.length; i++) {
                hash = ((hash << 5) - hash) + seed.charCodeAt(i)
                hash = hash & hash
            }
            return Math.abs(Math.sin(hash + index) * 10000) % 1
        }

        const shuffled = [...allQuotes]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(i) * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        const offset = cursor || 0
        const paginatedQuotes = shuffled.slice(offset, offset + limit + 1)

        const hasMore = paginatedQuotes.length > limit
        const data = hasMore ? paginatedQuotes.slice(0, -1) : paginatedQuotes
        const nextCursor = hasMore ? offset + limit : null

        return {
            data,
            nextCursor,
            hasMore
        }
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
