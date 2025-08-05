export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Parse diff text into structured hunks
export interface ParsedHunk {
  header: string;
  oldStartLine: number;
  oldLineCount: number;
  newStartLine: number;
  newLineCount: number;
  lines: Array<{
    type: 'add' | 'remove' | 'context';
    oldLine?: number;
    newLine?: number;
    content: string;
  }>;
  isCollapsed: boolean;
}

export function parseDiff(diffText: string): ParsedHunk[] {
  if (!diffText) return [];

  const lines = diffText.split('\n');
  const hunks: ParsedHunk[] = [];
  let currentHunk: ParsedHunk | null = null;

  for (const line of lines) {
    // Check for hunk header (e.g., @@ -1,4 +1,6 @@)
    const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const oldStart = parseInt(hunkMatch[1], 10);
      const oldCount = parseInt(hunkMatch[2] || '1', 10);
      const newStart = parseInt(hunkMatch[3], 10);
      const newCount = parseInt(hunkMatch[4] || '1', 10);

      currentHunk = {
        header: line,
        oldStartLine: oldStart,
        oldLineCount: oldCount,
        newStartLine: newStart,
        newLineCount: newCount,
        lines: [],
        isCollapsed: false,
      };
    } else if (currentHunk) {
      // Parse diff line
      let type: 'add' | 'remove' | 'context' = 'context';
      let content = line;

      if (line.startsWith('+')) {
        type = 'add';
        content = line.substring(1);
      } else if (line.startsWith('-')) {
        type = 'remove';
        content = line.substring(1);
      } else if (line.startsWith(' ')) {
        type = 'context';
        content = line.substring(1);
      }

      currentHunk.lines.push({
        type,
        content,
        oldLine: type !== 'add' ? currentHunk.oldStartLine + currentHunk.lines.filter(l => l.type !== 'add').length : undefined,
        newLine: type !== 'remove' ? currentHunk.newStartLine + currentHunk.lines.filter(l => l.type !== 'remove').length : undefined,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}