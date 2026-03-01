interface GroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string | null;
    members: Array<{ memberId: number; ownername: string }>;
    memberCount: number;
  };
  onSave: (data: { name: string; description: string | null }) => void;
  onDelete: () => void;
  onAddMembers: () => void;
  isSubmitting?: boolean;
}

export default function GroupEditModal(params: GroupEditModalProps) {
  return params.group;
}
