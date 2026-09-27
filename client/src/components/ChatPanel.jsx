import { BotIcon, BotMessageSquareIcon, UserIcon } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import PromptInput from './PromptInput'

const ChatPanel = ({ messages, onSend, loading }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages, loading])

  return (
    <div className='flex flex-col h-full'>
      {/* Messages */}
      <div className='flex-1 px-4 py-4 space-y-4 overflow-y-auto'>
        {messages.length === 0 && (
          <div className='flex items-center justify-center h-full'>
            <p className='text-xs text-center text-zinc-400'>
              Ask AI to modify your website
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className='flex gap-2.5'>
            <div
              className={`flex items-center justify-center rounded-md size-6 shrink-0 ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 border border-zinc-200"
              }`}
            >
              {msg.role === "user"
                ? <UserIcon size={12} />
                : <BotMessageSquareIcon size={12} />}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-[11px] font-semibold text-zinc-500 mb-1'>
                {msg.role === "user" ? "You" : "AI"}
              </p>
              <p className='text-xs leading-relaxed break-words text-zinc-700 whitespace-pre-wrap'>
                {msg.content.split("- `/").map((text, i) => (
                  <span key={i}>
                    {i > 0 && <span className='font-mono text-zinc-500'>- `/</span>}
                    {text}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className='flex gap-2.5'>
            <div className='flex items-center justify-center border rounded-md size-6 shrink-0 bg-zinc-100 text-zinc-700 border-zinc-200'>
              <BotIcon size={12} />
            </div>
            <div className='flex-1'>
              <p className='text-[11px] font-semibold text-zinc-500 mb-1'>AI</p>
              <div className='flex items-center gap-1 py-1'>
                <span className='size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]' />
                <span className='size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]' />
                <span className='size-1.5 rounded-full bg-zinc-400 animate-bounce' />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className='p-3 border-t border-zinc-200 bg-zinc-50/60'>
        <PromptInput
          onSubmit={onSend}
          loading={loading}
          placeholder='Ask AI to modify'
          autoFocus
        />
      </div>
    </div>
  )
}

export default ChatPanel