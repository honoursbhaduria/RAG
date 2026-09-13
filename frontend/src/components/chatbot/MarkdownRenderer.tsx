import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ui/code-block';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`markdown-content w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tables
          table: ({ ...props }) => (
            <div className="my-4 w-full overflow-x-auto rounded-xl border border-neutral-800 bg-[#121216] shadow-sm">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead
              className="border-b border-neutral-700/80 bg-neutral-900/90 text-neutral-300 font-mono uppercase tracking-wider text-[11px]"
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <th
              className="px-3.5 py-2.5 font-semibold text-neutral-200 border-r border-neutral-800/60 last:border-r-0 whitespace-nowrap"
              {...props}
            />
          ),
          tr: ({ ...props }) => (
            <tr
              className="border-b border-neutral-800/60 last:border-b-0 hover:bg-neutral-800/30 transition-colors"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-3.5 py-2.5 text-neutral-300 border-r border-neutral-800/40 last:border-r-0 leading-relaxed align-top"
              {...props}
            />
          ),

          // Headings
          h1: ({ ...props }) => (
            <h1
              className="text-lg sm:text-xl font-bold text-white mt-6 mb-3 pb-1.5 border-b border-neutral-800 tracking-tight"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-base sm:text-lg font-bold text-neutral-100 mt-5 mb-2.5 pb-1 border-b border-neutral-800/60 tracking-tight"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-sm sm:text-base font-semibold text-neutral-200 mt-4 mb-2 tracking-tight"
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-neutral-300 mt-3 mb-1.5" {...props} />
          ),

          // Paragraphs & Text
          p: ({ ...props }) => (
            <p className="text-sm leading-relaxed text-neutral-200 my-2.5 selection:bg-blue-500/30" {...props} />
          ),
          strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
          em: ({ ...props }) => <em className="italic text-neutral-300" {...props} />,

          // Lists
          ul: ({ ...props }) => (
            <ul className="my-2.5 ml-5 list-disc space-y-1.5 text-sm text-neutral-200" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-2.5 ml-5 list-decimal space-y-1.5 text-sm text-neutral-200" {...props} />
          ),
          li: ({ ...props }) => <li className="leading-relaxed pl-1" {...props} />,

          // Dividers & Blockquotes
          hr: ({ ...props }) => <hr className="my-5 border-neutral-800" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-3 pl-4 border-l-2 border-blue-500/80 italic text-neutral-300 bg-blue-950/20 py-2 pr-3 rounded-r-lg"
              {...props}
            />
          ),

          // Links
          a: ({ href, children, ...props }: any) => {
            const isSafe = href && /^(https?:\/\/|mailto:|\/|#)/i.test(href);
            return (
              <a
                href={isSafe ? href : '#'}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer"
                target="_blank"
                rel="noreferrer noopener"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Code blocks & Inline code
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              const lang = match ? match[1] : 'text';
              return (
                <div className="my-3 overflow-hidden rounded-xl">
                  <CodeBlock
                    language={lang}
                    filename={`code.${lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang}`}
                    code={codeString}
                  />
                </div>
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-neutral-800/90 border border-neutral-700/60 font-mono text-[12px] text-amber-300 font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
