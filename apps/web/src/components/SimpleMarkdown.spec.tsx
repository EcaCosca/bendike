import { render, screen } from '@testing-library/react';
import { parseBlocks } from './markdown-blocks';
import { SimpleMarkdown } from './SimpleMarkdown';

describe('parseBlocks', () => {
  test('splits paragraphs on blank lines', () => {
    expect(parseBlocks('One.\n\nTwo.')).toEqual([
      { type: 'paragraph', text: 'One.' },
      { type: 'paragraph', text: 'Two.' },
    ]);
  });

  test('reads a heading with its level', () => {
    expect(parseBlocks('## Materials')).toEqual([{ type: 'heading', level: 2, text: 'Materials' }]);
  });

  test('groups consecutive dash lines into one list', () => {
    expect(parseBlocks('- Fast\n- Light')).toEqual([{ type: 'list', items: ['Fast', 'Light'] }]);
  });

  test('a paragraph followed directly by a list keeps both', () => {
    expect(parseBlocks('Intro\n- A\n- B')).toEqual([
      { type: 'paragraph', text: 'Intro' },
      { type: 'list', items: ['A', 'B'] },
    ]);
  });

  test('an empty string has no blocks', () => {
    expect(parseBlocks('')).toEqual([]);
  });
});

describe('SimpleMarkdown', () => {
  test('renders headings, lists, bold text and turns links into plain text', () => {
    render(<SimpleMarkdown source={'# Title\n\nSome **bold** and a [link](/x) here.\n\n- one\n- two'} />);

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText(/and a link here\./)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
