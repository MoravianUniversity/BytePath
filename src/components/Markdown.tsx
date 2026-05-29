import { useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

const markdownComponents: Components = {
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  code({ className, children, ...props }) {
    const text = String(children).replace(/\n$/, '');
    const langMatch = /language-(\w+)/.exec(className ?? '');
    if (langMatch) {
      const lang = langMatch[1];
      const grammar = Prism.languages[lang] ?? Prism.languages.python;
      const html = Prism.highlight(text, grammar, lang);
      return (
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return (
      <code className="language-python inline-code" {...props}>
        {children}
      </code>
    );
  },
};

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current
      ?.querySelectorAll('code.language-python:not([data-highlighted])')
      .forEach((el) => Prism.highlightElement(el));
  }, [content]);

  return (
    <div ref={containerRef} className={`markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
