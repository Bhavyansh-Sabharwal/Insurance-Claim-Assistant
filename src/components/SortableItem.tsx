import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@chakra-ui/react';

type SortableItemProps = {
  id: string;
  children: (provided: {
    listeners: any;
    attributes: any;
  }) => React.ReactNode;
};

export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
    >
      {children({ listeners, attributes })}
    </Box>
  );
} 