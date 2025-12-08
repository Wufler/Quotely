'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveData } from '@/app/actions'
import { authClient } from '@/lib/auth-client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Alert, AlertDescription } from './ui/alert'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from '@/components/ui/dialog'
import { MessageCirclePlus, Sparkles, QuoteIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export default function CreateQuote({ onQuoteAdded }: CreateQuoteProps) {
	const [author, setAuthor] = useState('')
	const [quote, setQuote] = useState('')
	const [isPending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const router = useRouter()
	const { data: session } = authClient.useSession()

	const anonymousSignIn = async () => {
		await authClient.signIn.anonymous()
	}

	const create = async (formData: FormData) => {
		try {
			const quoteText = formData.get('quote') as string
			const authorText = formData.get('author') as string

			startTransition(async () => {
				let id = session?.user?.id

				if (!id) {
					await anonymousSignIn()
					const updatedSession = await authClient.getSession()
					id = updatedSession?.data?.user?.id
				}

				const newQuote = await saveData(quoteText, authorText, id as string)
				if (newQuote) {
					toast.success('✨ Quote added successfully!')
					if (onQuoteAdded) {
						onQuoteAdded(newQuote as Quote)
					}
					setOpen(false)
					setAuthor('')
					setQuote('')
				} else {
					toast.error('Failed to add quote. Please try again.')
				}
			})
		} catch (error) {
			console.error(error)
			toast.error('Failed to add quote. Please try again.')
		}
	}

	return (
		<div>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="ghost"
						className="[&_svg]:size-6 size-10 relative rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
					>
						<MessageCirclePlus className="" />
						<span className="sr-only">Create new quote</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl">
							<Sparkles className="size-5 text-primary" />
							Create an Inspiring Quote
						</DialogTitle>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<form action={create} className="space-y-6 mt-4">
								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
								>
									<Label
										htmlFor="author"
										className="text-sm font-medium  flex items-center gap-2"
									>
										Who said it?
									</Label>
									<Input
										id="author"
										name="author"
										placeholder="William Shakespeare"
										maxLength={40}
										value={author}
										onChange={e => setAuthor(e.target.value)}
										required
										className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 text-black dark:text-white"
									/>
									<div className="text-xs text-muted-foreground transition-colors flex items-center">
										<span
											className={
												author.length === 40 ? 'text-destructive font-medium' : ''
											}
										>
											{author.length}
										</span>
										/40 characters
									</div>
								</motion.div>

								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2 }}
								>
									<Label
										htmlFor="quote"
										className="text-sm font-medium flex items-center gap-2"
									>
										<QuoteIcon className="h-4 w-4 text-primary" />
										The Quote
									</Label>
									<div className="relative">
										<span className="absolute left-3 top-3 text-muted-foreground">
											&ldquo;
										</span>
										<Textarea
											id="quote"
											name="quote"
											placeholder="Share wisdom that inspires..."
											maxLength={255}
											value={quote}
											required
											onChange={e => setQuote(e.target.value)}
											className={cn(
												'min-h-[120px] transition-all duration-200',
												'focus:ring-2 focus:ring-primary/20 resize-none',
												'text-black dark:text-white pl-6 pr-6'
											)}
										/>
										<span className="absolute right-3 top-3 text-muted-foreground">
											&rdquo;
										</span>
									</div>
									<div className="text-xs text-muted-foreground transition-colors flex items-center">
										<span
											className={
												quote.length === 255 ? 'text-destructive font-medium' : ''
											}
										>
											{quote.length}
										</span>
										/255 characters
									</div>
								</motion.div>

								{(!session || session?.user?.isAnonymous) && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
									>
										<Alert className="bg-primary/5 border-primary/20">
											<AlertDescription className="text-sm">
												✨ Sign in to access your quotes across all your devices.
											</AlertDescription>
											{!session?.user?.isAnonymous && (
												<div className="text-xs text-muted-foreground">
													Publishing a quote now will sign you in anonymously.
												</div>
											)}
										</Alert>
									</motion.div>
								)}

								<DialogFooter>
									<Button
										type="submit"
										disabled={isPending}
										className="w-full transition-all duration-200 hover:scale-[1.02]"
									>
										{isPending ? (
											<>
												<Sparkles className="size-4 animate-spin text-yellow-500" />
												Adding...
											</>
										) : (
											<>
												<Sparkles className="size-4" />
												Publish Quote
											</>
										)}
									</Button>
								</DialogFooter>
							</form>
						</motion.div>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
