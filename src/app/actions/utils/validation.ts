export function sanitizeString(input: string, maxLength: number): string {
    return input.trim().slice(0, maxLength)
}

export function validateQuoteInput(quote: string, author: string): { valid: boolean; error?: string } {
    if (!quote || quote.trim().length === 0) {
        return { valid: false, error: 'Quote cannot be empty' }
    }
    if (!author || author.trim().length === 0) {
        return { valid: false, error: 'Author cannot be empty' }
    }
    if (quote.trim().length > 1000) {
        return { valid: false, error: 'Quote is too long (max 1000 characters)' }
    }
    if (author.trim().length > 100) {
        return { valid: false, error: 'Author name is too long (max 100 characters)' }
    }
    return { valid: true }
}
