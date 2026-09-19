import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { parseBlocks } from './markdown-blocks';

function renderInline(text: string): ReactNode[] {
  const withoutLinks = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  return withoutLinks
    .split(/(\*\*[^*]+\*\*)/)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

export function SimpleMarkdown({ source }: { source: string }) {
  return (
    <Box>
      {parseBlocks(source).map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Typography
              key={index}
              variant="h6"
              component={`h${Math.min(block.level + 1, 6)}` as 'h2'}
              sx={{ mt: 2, mb: 1 }}
            >
              {renderInline(block.text)}
            </Typography>
          );
        }
        if (block.type === 'list') {
          return (
            <Box key={index} component="ul" sx={{ pl: 3, my: 1 }}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Typography component="span">{renderInline(item)}</Typography>
                </li>
              ))}
            </Box>
          );
        }
        return (
          <Typography key={index} paragraph>
            {renderInline(block.text)}
          </Typography>
        );
      })}
    </Box>
  );
}
