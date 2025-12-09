import Quotes from '@/components/Quotes'
import { getData } from './actions'
import { connection } from 'next/server'

export default async function Home() {
	await connection()
	const result = await getData()

	return (
		<Quotes
			initialData={result.data as Quote[]}
			initialCursor={result.nextCursor}
			initialHasMore={result.hasMore}
		/>
	)
}
