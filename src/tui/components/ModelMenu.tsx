import { Box, Text } from 'ink';
import type { ModelOption } from '@types';

export const ModelMenu = ({ models, selectedIndex, currentModelId }: { models: ModelOption[]; selectedIndex: number; currentModelId: number }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      marginTop={1}
    >
      {models.map((model) => {
        const isSelected = selectedIndex >= 0 && models[selectedIndex]?.id === model.id;
        const isCurrent = model.id === currentModelId;
        return (
          <Box key={model.id}>
            <Text color={isSelected ? 'cyan' : undefined}>
              {isSelected ? '❯ ' : '  '}
              <Text bold color={isSelected ? 'cyan' : undefined}>
                {`${String(model.id).padStart(2, ' ')}. ${model.label}`}
              </Text>
              <Text dimColor>{` (${model.name} • ${model.effort})`}</Text>
              {isCurrent ? <Text color="green">  [current]</Text> : null}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

