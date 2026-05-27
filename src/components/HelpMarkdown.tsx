import { useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

const helpMarkdownComponents: Components = {
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
      <code className="language-python" {...props}>
        {children}
      </code>
    );
  },
};

interface HelpMarkdownProps {
  content: string;
}

export function HelpMarkdown({ content }: HelpMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current
      ?.querySelectorAll('code.language-python:not([data-highlighted])')
      .forEach((el) => Prism.highlightElement(el));
  }, [content]);

  return (
    <div ref={containerRef} className="question-help-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={helpMarkdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
