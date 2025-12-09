'use client'
import { incrementLikes, decrementLikes } from '@/app/actions'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from './ui/button'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Likes({
	id,
	likes,
	onLikesUpdate,
}: {
	id: string
	likes: number
	onLikesUpdate: (newLikes: number) => void
}) {
	const { data: session } = authClient.useSession()
	const [userVote, setUserVote] = useState(0)

	const handleLike = async () => {
		if (!session?.user?.id) {
			toast.error('Please sign in to like quotes')
			return
		}

		const result = await incrementLikes(Number(id), session.user.id)
		if (result?.likes !== undefined) {
			onLikesUpdate(result.likes)
			if (userVote === 1) {
				setUserVote(0)
			} else if (userVote === -1) {
				setUserVote(1)
			} else {
				setUserVote(1)
			}
		}
	}

	const handleDislike = async () => {
		if (!session?.user?.id) {
			toast.error('Please sign in to dislike quotes')
			return
		}

		const result = await decrementLikes(Number(id), session.user.id)
		if (result?.likes !== undefined) {
			onLikesUpdate(result.likes)
			if (userVote === -1) {
				setUserVote(0)
			} else if (userVote === 1) {
				setUserVote(-1)
			} else {
				setUserVote(-1)
			}
		}
	}

	const formatLikes = (value: number) => {
		if (value >= 10000) return `${Math.floor(value / 1000)}k`
		if (value >= 1000)
			return `${Math.floor(value / 1000)}.${Math.floor((value % 1000) / 100)}k`
		if (value <= -10000) return `-${Math.floor(Math.abs(value) / 1000)}k`
		if (value <= -1000)
			return `-${Math.floor(Math.abs(value) / 1000)}.${Math.floor(
				(Math.abs(value) % 1000) / 100
			)}k`
		return value.toString()
	}

	return (
		<div className="flex items-center gap-1.5">
			<Button
				size="icon"
				onClick={handleLike}
				className={`size-8 ${
					userVote === 1
						? 'bg-green-600 hover:bg-green-800'
						: 'bg-transparent hover:bg-green-600'
				}`}
			>
				<ArrowUp className="size-4 dark:text-white text-black" />
			</Button>
			<div
				className={`flex h-8 w-14 items-center justify-center rounded-md text-sm font-medium ${
					likes < 0
						? 'bg-destructive text-destructive-foreground'
						: likes > 0
						? 'bg-green-600 text-green-50'
						: 'dark:text-muted-foreground'
				}`}
			>
				{formatLikes(likes)}
			</div>
			<Button
				size="icon"
				onClick={handleDislike}
				className={`size-8 ${
					userVote === -1
						? 'bg-destructive hover:bg-destructive/60'
						: 'bg-transparent hover:bg-destructive'
				}`}
			>
				<ArrowDown className="size-4 dark:text-white text-black" />
			</Button>
		</div>
	)
}
