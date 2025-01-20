import { DragHandleIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/react';

type SortableHandleProps = {
  listeners?: any;
  attributes?: any;
};

const SortableHandle = ({ listeners, attributes }: SortableHandleProps) => (
  <Box {...attributes} {...listeners} cursor="grab" mr={2} _active={{ cursor: 'grabbing' }}>
    <DragHandleIcon />
  </Box>
);

export default SortableHandle; 