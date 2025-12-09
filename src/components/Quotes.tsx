'use client'
import Delete from '@/components/DeleteQuote'
import Likes from '@/components/Likes'
import { useEffect, useState, useTransition, useCallback, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getData, getFilteredData } from '@/app/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
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
					cursor || undefined
				)
			} else {
				result = await getData(cursor || undefined)
			}

			setQuotes(prev => [...prev, ...(result.data as Quote[])])
			setCursor(result.nextCursor)
			setHasMore(result.hasMore)
		} catch (error) {
			console.error('Error loading more quotes:', error)
		} finally {
			setIsLoadingMore(false)
		}
	}, [cursor, hasMore, isLoadingMore, currentFilters])

	const handleFilterChange = useCallback(
		async (filters: { filterType: FilterOption; sortBy: SortOption }) => {
			startTransition(async () => {
				try {
					setCurrentFilters(filters)
					const result = await getFilteredData(
						{
							filterType: filters.filterType,
						},
						filters.sortBy
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
		[initialData, initialCursor, initialHasMore]
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

		if (observerTarget.current) {
			observer.observe(observerTarget.current)
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current)
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

			<div className="container mx-auto h-full p-4 py-6 flex-grow grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 content-start">
				{isFilterLoading ? (
					<>
						{[...Array(quotes.length)].map((_, i) => (
							<Card key={i} className="bg-card">
								<CardHeader>
									<Skeleton className="h-4 w-[250px]" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-20 w-full" />
								</CardContent>
								<CardFooter>
									<Skeleton className="h-4 w-[200px]" />
								</CardFooter>
							</Card>
						))}
					</>
				) : quotes.length === 0 ? (
					<p className="col-span-full text-center text-muted-foreground">
						No quotes found matching your filters!
					</p>
				) : (
					quotes.map(q => (
						<Card
							key={q.id}
							className={cn(
								'relative group border dark:border-gray-800',
								'dark:bg-gradient-to-br dark:from-gray-900/50 dark:to-gray-800/50',
								'bg-gradient-to-br from-white to-gray-50/50',
								'flex flex-col min-h-[300px]'
							)}
						>
							<CardHeader className="pb-2">
								<div className="flex items-center gap-2">
									<Avatar className="h-8 w-8">
										<AvatarImage src={q.user?.image || ''} />
										<AvatarFallback>{q.user?.name?.[0] || '?'}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="text-sm font-medium">
											{q.user?.name || 'Anonymous'}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(q.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-4 relative flex-grow">
								<div className="absolute top-0 left-2 text-7xl leading-none opacity-10 dark:opacity-5 font-serif select-none text-primary">
									&ldquo;
								</div>
								<blockquote className="text-lg leading-relaxed tracking-wide relative z-10">
									<span className="font-serif italic [overflow-wrap:anywhere]">
										{q.quote}
									</span>
								</blockquote>
								<p className="text-sm text-muted-foreground text-right mt-4 font-medium tracking-wide [overflow-wrap:anywhere]">
									— {q.author}
								</p>
								<div className="absolute bottom-0 right-2 text-7xl leading-none opacity-10 dark:opacity-5 font-serif select-none text-primary rotate-180">
									&ldquo;
								</div>
							</CardContent>
							<CardFooter className="flex flex-col gap-2 py-4 border-t dark:border-gray-800 bg-gradient-to-b from-transparent to-muted/5 mt-auto">
								<div className="flex items-center justify-between w-full">
									<Likes
										id={q.id.toString()}
										likes={q.likes}
										onLikesUpdate={newLikes =>
											updateQuoteLikes(q.id.toString(), newLikes)
										}
									/>
									{session?.user?.id === q.userId && (
										<div className="flex items-center gap-2">
											<Delete id={q.id} onDelete={() => removeQuote(q.id)} />
										</div>
									)}
								</div>
							</CardFooter>
						</Card>
					))
				)}

				{!isFilterLoading && quotes.length > 0 && (
					<div
						ref={observerTarget}
						className="col-span-full flex justify-center py-8"
					>
						{isLoadingMore && (
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						)}
					</div>
				)}
			</div>

			<div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-muted/5 py-6">
				2025,{' '}
				<Link href="https://wolfey.me" target="_blank">
					wolfey.me
				</Link>
			</div>
		</div>
	)
}
