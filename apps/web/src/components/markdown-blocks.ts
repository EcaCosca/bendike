export type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flush() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
    if (list.length > 0) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  }

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const listItem = /^[-*]\s+(.*)$/.exec(line);

    if (line === '') {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ type: 'heading', level: (heading[1] ?? '#').length, text: heading[2] ?? '' });
    } else if (listItem) {
      if (paragraph.length > 0) {
        flush();
      }
      list.push(listItem[1] ?? '');
    } else {
      if (list.length > 0) {
        flush();
      }
      paragraph.push(line);
    }
  }
  flush();

  return blocks;
}
