interface Props {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }
  
  export default function MessageBubble({ role, content, timestamp }: Props) {
    const isUser = role === 'user';
  
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] space-y-1`}>
          {!isUser && (
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-xs font-medium text-brand-600">✦ Orbit AI</span>
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
            }`}
          >
            {content}
          </div>
          {timestamp && (
            <p className={`text-xs text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    );
  }