import Quotes from '@/components/Quotes'
import { getData } from './actions'
import { connection } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function Home() {
	await connection()
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	const result = await getData(undefined, 12, session?.user?.id)

	return (
		<Quotes
			initialData={result.data as Quote[]}
			initialCursor={result.nextCursor}
			initialHasMore={result.hasMore}
		/>
	)
}
