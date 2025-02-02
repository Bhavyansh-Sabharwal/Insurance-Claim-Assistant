import { DragHandleIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/react';

const SortableHandle = () => (
  <Box cursor="grab" mr={2} _active={{ cursor: 'grabbing' }}>
    <DragHandleIcon />
  </Box>
);

export default SortableHandle; 