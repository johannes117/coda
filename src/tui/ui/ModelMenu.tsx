import { Box, Text } from 'ink';
import type { ModelOption } from '../../types/index.js';

type Props = {
  models: ModelOption[];
  selectedIndex: number;
  currentModelId: number;
};

export const ModelMenu = ({ models, selectedIndex, currentModelId }: Props) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      <Box marginBottom={1}>
        <Text bold>Select a model:</Text>
      </Box>
      {models.map((model, index) => {
        const isSelected = selectedIndex === index;
        const isCurrent = model.id === currentModelId;
        return (
          <Box key={model.id}>
            <Text color={isSelected ? 'cyan' : undefined}>
              {isSelected ? '❯ ' : '  '}
              <Text bold color={isSelected ? 'cyan' : undefined}>
                {`${model.id}. ${model.label}`}
              </Text>
              {isCurrent && <Text color="yellow"> (current)</Text>}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};
