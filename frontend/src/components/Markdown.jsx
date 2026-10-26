import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Box } from '@mui/material';

function LinkExterno({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Descrição das vagas: vem do GitHub em markdown com HTML misturado.
// rehype-raw interpreta o HTML e rehype-sanitize remove o que é perigoso
// (scripts, onerror, javascript:...). Nunca renderize a descrição de outro jeito.
export default function Markdown({ children }) {
  return (
    <Box
      sx={{
        overflowWrap: 'anywhere',
        lineHeight: 1.7,
        '& h1, & h2, & h3, & h4': { fontSize: '1.05rem', fontWeight: 600, mt: 3, mb: 1 },
        '& p': { my: 1.25 },
        '& ul, & ol': { pl: 3, my: 1 },
        '& li': { mb: 0.5 },
        '& a': { color: 'primary.main' },
        '& img': { maxWidth: '100%' },
        '& table': { borderCollapse: 'collapse', display: 'block', overflowX: 'auto' },
        '& th, & td': { border: 1, borderColor: 'divider', px: 1, py: 0.5 },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{ a: LinkExterno }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
}
