'use client'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteData } from '@/app/actions'
import { Button } from './ui/button'
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
} from './ui/alert-dialog'

export default function DeleteQuote({
	id,
	onDelete,
}: {
	id: number
	onDelete: () => void
}) {
	const [isOpen, setIsOpen] = useState(false)

	const remove = async (formData: FormData) => {
		const id = Number(formData.get('id'))
		await deleteData(id)
		onDelete()
		setIsOpen(false)
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					size="icon"
					className="size-8 bg-transparent hover:bg-destructive text-black dark:text-white"
				>
					<Trash2 className="size-4" />
				</Button>
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete this quote.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<form action={remove}>
						<input type="hidden" name="id" value={id} />
						<AlertDialogAction
							type="submit"
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
						>
							Delete Quote
						</AlertDialogAction>
					</form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
