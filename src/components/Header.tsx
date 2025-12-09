import Link from 'next/link'
import CreateQuote from './AddQuote'
import QuoteFilters from './FilterQuotes'
import Profile from './Profile'

export default function Header({
	onFilterChange,
	onQuoteAdded,
}: {
	onFilterChange: (filters: {
		filterType: FilterOption
		sortBy: SortOption
	}) => void
	onQuoteAdded?: (quote: Quote) => void
}) {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-2">
						<Link
							href="/"
							className="flex items-center gap-2 transition-colors hover:opacity-90"
						>
							<span className="text-xl font-bold tracking-tight">Quotely</span>
						</Link>
					</div>

					<div className="hidden md:flex items-center gap-6">
						<QuoteFilters onFilterChange={onFilterChange} />
						<div className="flex items-center gap-3 pl-6 border-l">
							<CreateQuote onQuoteAdded={onQuoteAdded} />
							<Profile />
						</div>
					</div>

					<div className="flex md:hidden items-center gap-2">
						<CreateQuote onQuoteAdded={onQuoteAdded} />
						<Profile />
					</div>
				</div>

				<div className="md:hidden py-3 border-t overflow-x-auto">
					<div className="flex justify-center">
						<QuoteFilters onFilterChange={onFilterChange} />
					</div>
				</div>
			</div>
		</header>
	)
}
