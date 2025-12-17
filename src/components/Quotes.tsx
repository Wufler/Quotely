'use client'
import Delete from '@/components/DeleteQuote'
import Likes from '@/components/Likes'
import { useEffect, useState, useTransition, useCallback, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getData, getFilteredData } from '@/app/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { authClient } from '@/lib/auth-client'
import Header from './Header'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function Quotes({
	initialData,
	initialCursor,
	initialHasMore,
}: {
	initialData: Quote[]
	initialCursor: number | null
	initialHasMore: boolean
}) {
	const [quotes, setQuotes] = useState<Quote[]>(initialData)
	const [isFilterLoading, startTransition] = useTransition()
	const { data: session } = authClient.useSession()
	const [mounted, setMounted] = useState(false)
	const [cursor, setCursor] = useState<number | null>(initialCursor)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [currentFilters, setCurrentFilters] = useState<{
		filterType: FilterOption
		sortBy: SortOption
	} | null>(null)
	const observerTarget = useRef<HTMLDivElement>(null)

	const updateQuoteLikes = (quoteId: string, newLikes: number) => {
		setQuotes(prevQuotes =>
			prevQuotes.map(quote =>
				quote.id.toString() === quoteId ? { ...quote, likes: newLikes } : quote
			)
		)
	}

	const removeQuote = (quoteId: number) => {
		setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId))
	}

	const addQuote = (newQuote: Quote) => {
		setQuotes(prevQuotes => [newQuote, ...prevQuotes])
	}

	const loadMore = useCallback(async () => {
		if (!hasMore || isLoadingMore) return

		setIsLoadingMore(true)
		try {
			let result
			if (currentFilters) {
				result = await getFilteredData(
					{ filterType: currentFilters.filterType },
					currentFilters.sortBy,
					cursor || undefined,
					12,
					session?.user?.id
				)
			} else {
				result = await getData(cursor || undefined, 12, session?.user?.id)
			}

			setQuotes(prev => [...prev, ...(result.data as Quote[])])
			setCursor(result.nextCursor)
			setHasMore(result.hasMore)
		} catch (error) {
			console.error('Error loading more quotes:', error)
		} finally {
			setIsLoadingMore(false)
		}
	}, [cursor, hasMore, isLoadingMore, currentFilters, session?.user?.id])

	const handleFilterChange = useCallback(
		async (filters: { filterType: FilterOption; sortBy: SortOption }) => {
			startTransition(async () => {
				try {
					setCurrentFilters(filters)
					const result = await getFilteredData(
						{
							filterType: filters.filterType,
						},
						filters.sortBy,
						undefined,
						12,
						session?.user?.id
					)
					setQuotes(result.data as Quote[])
					setCursor(result.nextCursor)
					setHasMore(result.hasMore)
				} catch (error) {
					console.error('Error applying filters:', error)
					setQuotes(initialData)
					setCursor(initialCursor)
					setHasMore(initialHasMore)
				}
			})
		},
		[initialData, initialCursor, initialHasMore, session?.user?.id]
	)

	useEffect(() => {
		const applyInitialFilters = async () => {
			const savedFilters = localStorage.getItem('quoteFilters')
			if (savedFilters) {
				const filters = JSON.parse(savedFilters)
				await handleFilterChange(filters)
			}
		}

		applyInitialFilters()
	}, [handleFilterChange])

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const observer = new IntersectionObserver(
			entries => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!isLoadingMore &&
					!isFilterLoading
				) {
					loadMore()
				}
			},
			{ threshold: 0.1 }
		)

		const currentTarget = observerTarget.current

		if (currentTarget) {
			observer.observe(currentTarget)
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget)
			}
		}
	}, [hasMore, isLoadingMore, isFilterLoading, loadMore])

	if (!mounted) {
		return (
			<div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50 dark:bg-zinc-950">
				<Loader2 className="size-16 animate-spin" />
			</div>
		)
	}

	return (
		<div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
			<Header onFilterChange={handleFilterChange} onQuoteAdded={addQuote} />

			<div className="container mx-auto h-full p-4 py-6 grow grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 content-start">
				{isFilterLoading ? (
					<>
						{[...Array(quotes.length)].map((_, i) => (
							<Card key={i} className="bg-card">
								<CardHeader>
									<Skeleton className="h-4 w-62.5" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-20 w-full" />
								</CardContent>
								<CardFooter>
									<Skeleton className="h-4 w-62.5" />
								</CardFooter>
							</Card>
						))}
					</>
				) : quotes.length === 0 ? (
					<p className="col-span-full text-center text-muted-foreground">
						No quotes found matching your filters!
					</p>
				) : (
					quotes.map((q, index) => (
						<Card
							key={`${q.id}-${index}`}
							className="flex flex-col h-full border-border/50 bg-card/50 py-0 pt-8"
						>
							<CardHeader className="grow">
								<blockquote className="relative">
									<span className="text-4xl text-primary/20 absolute -top-4 -left-2 font-serif select-none">
										&ldquo;
									</span>
									<p className="text-xl font-serif leading-relaxed text-foreground/90 px-2 italic wrap-anywhere">
										{q.quote}
									</p>
									<span className="text-4xl text-primary/20 absolute -bottom-8 -right-2 font-serif select-none">
										&rdquo;
									</span>
								</blockquote>
								<div className="mt-6 text-right">
									<cite className="text-sm font-medium text-muted-foreground not-italic wrap-anywhere">
										— {q.author}
									</cite>
								</div>
							</CardHeader>
							<CardContent className="py-2 border-t border-border/50 bg-muted/20">
								<div className="flex items-center justify-between w-full py-2">
									<Likes
										id={q.id.toString()}
										likes={q.likes}
										onLikesUpdate={newLikes =>
											updateQuoteLikes(q.id.toString(), newLikes)
										}
										initialUserVote={q.userLikes?.[0]?.value || 0}
									/>
									{session?.user?.id === q.userId && (
										<div className="flex items-center gap-2">
											<Delete id={q.id} onDelete={() => removeQuote(q.id)} />
										</div>
									)}
								</div>
								<div className="flex items-center gap-4 pb-2">
									<Avatar className="size-9 border border-border/50">
										<AvatarImage src={q.user?.image || ''} />
										<AvatarFallback>{q.user?.name?.[0] || '?'}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="text-sm font-semibold leading-none">
											{q.user?.name || 'Anonymous'}
										</span>
										<span className="text-xs text-muted-foreground mt-1">
											{new Date(q.createdAt).toLocaleDateString(undefined, {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}

				{!isFilterLoading && quotes.length > 0 && (
					<div
						ref={observerTarget}
						className="col-span-full flex justify-center py-6"
					>
						{isLoadingMore ? (
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						) : (
							<p className="text-muted-foreground text-sm italic">
								&ldquo;you&apos;ve reached the end of the quotes.&ldquo;
							</p>
						)}
					</div>
				)}
			</div>

			<footer className="text-center text-sm text-gray-500 dark:text-gray-400 dark:bg-muted/5 bg-muted py-4 border-t border-border/30">
				<div className="flex flex-col items-center justify-center gap-2">
					<span>
						2025{' '}
						<Link
							href="https://wolfey.me"
							target="_blank"
							className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
						>
							wolfey.me
						</Link>
					</span>
				</div>
			</footer>
		</div>
	)
}
