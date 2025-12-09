'use client'
import { useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select'

type FilterState = {
	filterType: FilterOption
	sortBy: SortOption
}

const defaultFilters: FilterState = {
	filterType: 'all',
	sortBy: 'default',
}

function getInitialFilters(): FilterState {
	if (typeof window === 'undefined') return defaultFilters

	const savedFilters = localStorage.getItem('quoteFilters')
	if (savedFilters) {
		try {
			const parsed = JSON.parse(savedFilters)
			return {
				filterType: parsed.filterType || defaultFilters.filterType,
				sortBy: parsed.sortBy || defaultFilters.sortBy,
			}
		} catch (error) {
			console.error('Error parsing saved filters:', error)
			localStorage.removeItem('quoteFilters')
		}
	}
	return defaultFilters
}

export default function QuoteFilters({
	onFilterChange,
}: {
	onFilterChange: (filters: FilterState) => void
}) {
	const [filters, setFilters] = useState<FilterState>(getInitialFilters)

	const handleFilterChange = (newFilters: Partial<FilterState>) => {
		const updatedFilters = { ...filters, ...newFilters }
		setFilters(updatedFilters)
		localStorage.setItem('quoteFilters', JSON.stringify(updatedFilters))
		onFilterChange(updatedFilters)
	}

	return (
		<div className="flex justify-center items-center gap-2">
			<Select
				value={filters.filterType}
				onValueChange={(value: FilterOption) =>
					handleFilterChange({ filterType: value })
				}
			>
				<SelectTrigger className="w-[140px]">
					<SelectValue placeholder="Filter by" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Quotes</SelectItem>
					<SelectItem value="likes">Likes Only</SelectItem>
					<SelectItem value="dislikes">Dislikes Only</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.sortBy}
				onValueChange={(value: SortOption) => handleFilterChange({ sortBy: value })}
			>
				<SelectTrigger className="w-[140px]">
					<SelectValue placeholder="Sort by" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="default">Default</SelectItem>
					<SelectItem value="new">Newest First</SelectItem>
					<SelectItem value="old">Oldest First</SelectItem>
					<SelectItem value="most">Most Likes</SelectItem>
					<SelectItem value="least">Least Likes</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}
