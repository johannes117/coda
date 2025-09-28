import { Box, Text } from 'ink';
import type { ReactElement } from 'react';
import type { DiffLine } from '@types';

const DiffRow = ({ line, pad }: { line: DiffLine; pad: number }) => {
  let sign = ' ';
  let color: string = 'gray';
  let oldNum = String(line.oldLine ?? ' ').padStart(pad);
  let newNum = String(line.newLine ?? ' ').padStart(pad);

  if (line.type === 'add') {
    sign = '+';
    color = 'green';
    oldNum = ' '.repeat(pad);
  } else if (line.type === 'remove') {
    sign = '-';
    color = 'red';
    newNum = ' '.repeat(pad);
  }

  const prefix = `${oldNum} ${newNum} `;

  return (
    <Text>
      <Text dimColor>{prefix}</Text>
      <Text color={color}>
        {sign} {line.text}
      </Text>
    </Text>
  );
};

export const DiffView = ({ diffLines }: { diffLines: DiffLine[] }) => {
  const CONTEXT = 2;
  const MIN_COLLAPSE = 4;
  const totalLines = diffLines.length;

  if (totalLines === 0) return null;

  const isChange = diffLines.map(line => line.type !== 'context');
  const visible = Array(totalLines).fill(false);

  for (let i = 0; i < totalLines; i++) {
    if (isChange[i]) {
      for (let j = Math.max(0, i - CONTEXT); j <= Math.min(totalLines - 1, i + CONTEXT); j++) {
        visible[j] = true;
      }
    }
  }

  const maxLineNum = Math.max(
    ...diffLines.map(line => line.oldLine ?? 0),
    ...diffLines.map(line => line.newLine ?? 0),
  );
  const pad = String(Math.max(maxLineNum, 1)).length;

  const renderedElements: ReactElement[] = [];
  let i = 0;

  while (i < totalLines) {
    if (visible[i]) {
      renderedElements.push(<DiffRow key={i} line={diffLines[i]} pad={pad} />);
      i++;
      continue;
    }

    let j = i;
    while (j < totalLines && !visible[j]) {
      j++;
    }
    const hiddenCount = j - i;
    if (hiddenCount >= MIN_COLLAPSE) {
      renderedElements.push(
        <Text key={`skip-${i}`} dimColor>
          {' '.repeat(pad * 2 + 2)} ...
        </Text>,
      );
    } else {
      for (let k = i; k < j; k++) {
        renderedElements.push(<DiffRow key={k} line={diffLines[k]} pad={pad} />);
      }
    }
    i = j;
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} marginTop={1}>
      {renderedElements}
    </Box>
  );
};

