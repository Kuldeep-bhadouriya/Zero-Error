'use client'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

function sanitizeAnnouncementUrl(url: string) {
  if (/^(https?:|mailto:)/i.test(url)) {
    return url
  }
  return ''
}

export function AnnouncementMessage({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn('announcement-markdown', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        urlTransform={sanitizeAnnouncementUrl}
        components={{
          p: ({ children }) => <p className="inline">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  )
}
