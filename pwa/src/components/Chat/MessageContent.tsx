import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

interface MessageContentProps {
  content: string;
  conversationId: string;
}

export default function MessageContent({ content }: MessageContentProps) {
  const sanitized = DOMPurify.sanitize(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
    >
      {sanitized}
    </ReactMarkdown>
  );
}
