import { basename } from 'node:path';

import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface StatusBarProps {
  filePath: string;
  requestCount: number;
  selectedIndex: number;
}

function truncateText(value: string, maxWidth: number): string {
  if (maxWidth <= 0) {
    return '';
  }

  if (value.length <= maxWidth) {
    return value;
  }

  if (maxWidth === 1) {
    return '…';
  }

  return `${value.slice(0, maxWidth - 1)}…`;
}

export function StatusBar({
  filePath,
  requestCount,
  selectedIndex,
}: StatusBarProps): React.ReactElement {
  const { stdout } = useStdout();
  const columns = stdout.columns || 80;
  const leftText = '[Enter] Send  [j/k] Nav  [Tab] Panel  [v] Verbose  [q] Quit';
  const rightText = `${basename(filePath)}  ${selectedIndex + 1}/${requestCount}`;
  const availableLeftWidth = Math.max(0, columns - rightText.length - 1);

  return (
    <Box width="100%" justifyContent="space-between">
      <Text color="gray">{truncateText(leftText, availableLeftWidth)}</Text>
      <Text color="gray">{rightText}</Text>
    </Box>
  );
}
