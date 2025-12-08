type Quote = {
    id: number
    quote: string
    author: string
    likes: number
    createdAt: Date
    updatedAt: Date
    userId: string | null
    user?: {
        id: string
        name: string | null
        image: string | null
    }
    userLikes?: QuoteLike[]
}

type QuoteLike = {
    id: number
    quoteId: number
    userId: string
    value: number
    quote?: Quote
    user?: {
        id: string
        name: string | null
        image: string | null
    }
}

type SortOption = 'default' | 'new' | 'old' | 'most' | 'least'
type FilterOption = 'all' | 'likes' | 'dislikes' | 'author'

type FilterParams = {
    filterType: FilterOption
    authorFilter?: string
}

type CreateQuoteProps = {
    onQuoteAdded?: (quote: Quote) => void
}