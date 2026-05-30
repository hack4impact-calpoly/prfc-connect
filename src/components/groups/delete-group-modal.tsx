import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteGroupModal({ open, onOpenChange, onConfirm, isDeleting = false }: DeleteGroupModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          if (isDeleting) e.preventDefault();
        }}
        className="max-w-[400px] flex flex-col items-center p-8"
      >
        <AlertDialogHeader className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-8 w-8 text-prfc-red" />
          </div>

          <div className="space-y-2 text-center">
            <AlertDialogTitle className="text-2xl font-bold">Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this group?
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex w-full gap-3 mt-6 sm:justify-center">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="flex-1 border-prfc-red text-prfc-red hover:bg-red-100 rounded-full py-6"
            >
              Cancel
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="flex-1 bg-prfc-brown text-white hover:bg-prfc-dark-brown rounded-full py-6"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isDeleting ? "Deleting..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
