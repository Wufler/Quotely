'use client'

import { authClient } from '@/lib/auth-client'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Loader2, User, LogIn, AlertCircle, Trash2, LogOut } from 'lucide-react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import Google from './ui/google'
import GitHub from './ui/github'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteAccount } from '@/app/actions'

export default function Profile() {
	const { data: session, isPending } = authClient.useSession()
	const { setTheme, resolvedTheme } = useTheme()

	const googleSignIn = async () => {
		await authClient.signIn.social({
			provider: 'google',
		})
	}

	const githubSignIn = async () => {
		await authClient.signIn.social({
			provider: 'github',
		})
	}

	const anonymousSignIn = async () => {
		await authClient.signIn.anonymous()
	}

	const handleSignOut = async () => {
		await authClient.signOut()
	}

	const handleDeleteAccount = async () => {
		await deleteAccount(session?.user?.id || '')
		await authClient.signOut()
	}

	if (session) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="size-10 rounded-full p-0 hover:bg-transparent"
					>
						<Avatar className="size-9 border border-border/50 transition-transform hover:scale-105">
							<AvatarImage
								src={session.user?.image || ''}
								alt={session.user?.name || ''}
							/>
							<AvatarFallback className="bg-muted/50">
								<User className="size-4 text-muted-foreground" />
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-64 p-2">
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-semibold leading-none">
								{session.user?.name}
							</p>
							<p className="text-xs leading-none text-muted-foreground truncate">
								{session.user?.email}
							</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={e => {
							e.preventDefault()
							setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
						}}
						className="flex items-center justify-between cursor-pointer py-2 my-2"
					>
						<span className="flex items-center gap-2">
							{resolvedTheme === 'light' ? (
								<Sun className="size-4 text-orange-500" />
							) : (
								<Moon className="size-4 text-blue-500" />
							)}
							Appearance
						</span>
						<span className="text-xs text-muted-foreground capitalize">
							{resolvedTheme}
						</span>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{session?.user?.isAnonymous && (
						<>
							<div className="px-1.5 py-1.5 text-xs font-semibold text-muted-foreground">
								Link Account
							</div>
							<DropdownMenuItem
								onClick={googleSignIn}
								className="flex items-center gap-2 py-2"
							>
								<Google />
								Link with Google
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={githubSignIn}
								className="flex items-center gap-2 py-2"
							>
								<GitHub className="invert dark:invert-0" />
								Link with GitHub
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{session?.user?.isAnonymous ? (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem
									onSelect={e => e.preventDefault()}
									className="text-destructive focus:text-destructive focus:bg-destructive/10 py-2"
								>
									<LogOut className="size-4" />
									Sign out
								</DropdownMenuItem>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle className="flex items-center gap-2">
										<AlertCircle className="size-5 text-yellow-500" /> Are you sure?
									</AlertDialogTitle>
									<AlertDialogDescription>
										You wont be able to sign into this anonymous account anymore and wont
										be able to manage your quotes.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteAccount}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Sign out
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : (
						<>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										onSelect={e => e.preventDefault()}
										className="text-destructive focus:text-destructive focus:bg-destructive/10 py-2 mt-2"
									>
										<Trash2 className="size-4" />
										Delete Account
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center gap-2">
											<AlertCircle className="size-5 text-destructive" /> Delete Account
										</AlertDialogTitle>
										<AlertDialogDescription>
											Your account will be deleted but your quotes will stay intact as
											anonymous and wont be able to be managed.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDeleteAccount}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Delete Account
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<DropdownMenuItem onClick={handleSignOut} className="py-2">
								<LogOut className="size-4" />
								Sign out
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}

	return (
		<>
			{isPending ? (
				<Loader2 className="animate-spin size-5 text-muted-foreground" />
			) : (
				<Dialog>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="gap-2 h-9 px-4 font-medium"
						>
							<LogIn className="size-4" />
							Sign In
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-100 p-6">
						<DialogHeader>
							<DialogTitle className="font-bold tracking-tight">Sign In</DialogTitle>
							<DialogDescription>
								Manage your quotes and preferences.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-3">
							<Button
								onClick={googleSignIn}
								className="w-full h-11 gap-3 px-4"
								variant="outline"
							>
								<Google />
								Continue with Google
							</Button>
							<Button
								onClick={githubSignIn}
								className="w-full h-11 gap-3 px-4"
								variant="outline"
							>
								<GitHub className="invert dark:invert-0" />
								Continue with GitHub
							</Button>
							<div className="relative my-2">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-background px-2 text-muted-foreground">Or</span>
								</div>
							</div>
							<Button
								onClick={anonymousSignIn}
								className="w-full h-11 gap-3 px-4"
								variant="secondary"
							>
								<User className="size-4" />
								Anonymous
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	)
}
