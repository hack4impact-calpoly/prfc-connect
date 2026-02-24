import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
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
  groupName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteGroupModal({
  open,
  onOpenChange,
  groupName,
  onConfirm,
  isDeleting = false,
}: DeleteGroupModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] flex flex-col items-center p-8">
        <AlertDialogHeader className="flex flex-col items-center gap-4">
          {/* Centered Trash Icon in Circle */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
            <Trash2 className="h-8 w-8 text-[#831002]" />
          </div>

          <div className="space-y-2 text-center">
            <AlertDialogTitle className="text-2xl font-bold">Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-bold text-black">{groupName}</span>?
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex w-full gap-3 mt-6 sm:justify-center">
          {/* Cancel Button: Outlined with Paso Red */}
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="flex-1 border-[#831002] text-[#831002] hover:bg-[#FEE2E2] rounded-full py-6"
            >
              Cancel
            </Button>
          </AlertDialogCancel>

          {/* Confirm Button: Filled with Paso Brown */}
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-[#523019] text-white hover:bg-[#3d2412] rounded-full py-6"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isDeleting ? "Deleting..." : "Confirm"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
