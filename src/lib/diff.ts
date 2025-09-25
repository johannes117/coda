export type DiffLine = {
  type: 'add' | 'remove' | 'context';
  oldLine?: number;
  newLine?: number;
  text: string;
};

const findLCS = (original: string[], updated: string[]): [number, number][] => {
  const table = Array(original.length + 1)
    .fill(null)
    .map(() => Array(updated.length + 1).fill(0));

  for (let i = 1; i <= original.length; i++) {
    for (let j = 1; j <= updated.length; j++) {
      if (original[i - 1] === updated[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  const indices: [number, number][] = [];
  let i = original.length;
  let j = updated.length;

  while (i > 0 && j > 0) {
    if (original[i - 1] === updated[j - 1]) {
      indices.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (table[i - 1][j] > table[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return indices;
};

export const buildDiffLines = (original: string[], updated: string[]): DiffLine[] => {
  const lcs = findLCS(original, updated);
  const diffLines: DiffLine[] = [];
  let originalIndex = 0;
  let updatedIndex = 0;
  let lcsIndex = 0;

  while (originalIndex < original.length || updatedIndex < updated.length) {
    const match = lcsIndex < lcs.length ? lcs[lcsIndex] : null;

    if (match && match[0] === originalIndex && match[1] === updatedIndex) {
      diffLines.push({
        type: 'context',
        oldLine: originalIndex + 1,
        newLine: updatedIndex + 1,
        text: original[originalIndex],
      });
      originalIndex++;
      updatedIndex++;
      lcsIndex++;
    } else if (match && match[0] === originalIndex) {
      diffLines.push({ type: 'add', newLine: updatedIndex + 1, text: updated[updatedIndex] });
      updatedIndex++;
    } else if (match && match[1] === updatedIndex) {
      diffLines.push({ type: 'remove', oldLine: originalIndex + 1, text: original[originalIndex] });
      originalIndex++;
    } else if (originalIndex < original.length) {
      diffLines.push({ type: 'remove', oldLine: originalIndex + 1, text: original[originalIndex] });
      originalIndex++;
    } else if (updatedIndex < updated.length) {
      diffLines.push({ type: 'add', newLine: updatedIndex + 1, text: updated[updatedIndex] });
      updatedIndex++;
    }
  }

  return diffLines;
};

