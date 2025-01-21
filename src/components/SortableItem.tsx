import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@chakra-ui/react';

type SortableItemProps = {
  id: string;
  children: React.ReactNode;
};

export function SortableItem({ id, children }: SortableItemProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging 
  } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </Box>
  );
} 