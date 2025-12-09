'use client'
import { Button } from '@/components/ui/button'

export default function Error({ reset }: { reset: () => void }) {
	return (
		<main className="px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<h1 className="mt-4 text-3xl font-bold tracking-tight">Oops!</h1>
				<p className="mt-6 text-base leading-7 text-muted-foreground">
					Something went wrong.
				</p>
				<div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button onClick={() => reset()}>Try Again</Button>
				</div>
			</div>
		</main>
	)
}
