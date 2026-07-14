import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, HeartHandshake, Loader2, Search } from 'lucide-react'
import { api } from '../api'

interface SupportMessage {
  id: string;
  sender_type: 'AGENT' | 'ADMIN';
  message_type: string;
  message: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Chat {
  agent: { id: string; full_name: string; telegram_username: string };
  messages: SupportMessage[];
  unread_count: number;
}

export default function Support() {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['admin_chats'],
    queryFn: async () => await api.get('/support/admin/chats'),
    refetchInterval: 5000,
  })

  const selectedChat = chats.find(c => c.agent.id === selectedAgentId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedChat?.messages])

  const replyMutation = useMutation({
    mutationFn: async ({ agentId, text }: { agentId: string, text: string }) => {
      await api.post(`/support/admin/reply/${agentId}`, { message: text })
    },
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['admin_chats'] })
    }
  })

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedAgentId) return
    replyMutation.mutate({ agentId: selectedAgentId, text: replyText.trim() })
  }

  const filteredChats = chats.filter(c => 
    c.agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.agent.telegram_username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-300 bg-white">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-blue-600" />
            Support Chats
          </h2>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search agents..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">
              No chats found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredChats.map(chat => (
                <button
                  key={chat.agent.id}
                  onClick={() => setSelectedAgentId(chat.agent.id)}
                  className={`w-full text-left p-4 hover:bg-slate-100 transition-colors flex items-start gap-3 ${selectedAgentId === chat.agent.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    {chat.agent.full_name?.charAt(0) || '@'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{chat.agent.full_name || `@${chat.agent.telegram_username}`}</h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(chat.messages[chat.messages.length - 1].created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{chat.messages[chat.messages.length - 1].message}</p>
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {chat.unread_count}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-300 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-bold text-slate-900">{selectedChat.agent.full_name || 'Agent'}</h3>
                <p className="text-xs text-slate-500">@{selectedChat.agent.telegram_username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {selectedChat.messages.map(msg => {
                const isAdmin = msg.sender_type === 'ADMIN'
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                      isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                      {msg.message_type && !isAdmin && (
                        <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">{msg.message_type}</div>
                      )}
                      
                      {msg.attachment_url && (
                        <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block mb-2">
                          <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full max-h-64 object-cover border border-black/10" />
                        </a>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-300">
              <form onSubmit={handleReply} className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl p-3 text-sm resize-none h-12 transition-all outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleReply(e)
                    }
                  }}
                  disabled={replyMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 flex items-center justify-center font-bold transition-colors disabled:opacity-50"
                >
                  {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium text-slate-500">Select an agent to view chat history</p>
          </div>
        )}
      </div>
    </div>
  )
}
