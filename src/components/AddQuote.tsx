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
import { MessageCirclePlus, Loader2, Quote } from 'lucide-react'
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
				try {
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
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes('Rate limit exceeded')
					) {
						toast.error(error.message)
					} else {
						toast.error('Failed to add quote. Please try again.')
					}
					console.error(error)
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
							<Quote className="size-5 text-primary" />
							Create an Inspiring Quote
						</DialogTitle>
						<div>
							<form action={create} className="space-y-6 mt-4">
								<div className="space-y-2">
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
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="quote"
										className="text-sm font-medium flex items-center gap-2"
									>
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
								</div>

								{(!session || session?.user?.isAnonymous) && (
									<div>
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
									</div>
								)}

								<DialogFooter>
									<Button
										type="submit"
										disabled={isPending}
										className="w-full transition-all duration-200 hover:scale-[1.02]"
									>
										{isPending ? (
											<>
												<Loader2 className="size-4 animate-spin" />
												Adding...
											</>
										) : (
											<>Publish Quote</>
										)}
									</Button>
								</DialogFooter>
							</form>
						</div>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
