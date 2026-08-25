import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen } from 'lucide-react';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your research assistant. Upload your PDFs and ask me any questions about them.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/query', { query: userMsg });
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.data.answer,
          citations: response.data.citations 
        }
      ]);
    } catch (error) {
      console.error("Query failed", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while searching. ' + (error.response?.data?.detail || '')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-0 shadow-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center gap-3">
        <Bot className="w-6 h-6 text-primary-400" />
        <h2 className="text-xl font-semibold">Research Chat</h2>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-gray-950/50 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary-600' : 'bg-gray-800 border border-gray-700'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary-400" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Citations section */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" /> Sources Used
                  </h4>
                  <div className="space-y-2">
                    {msg.citations.map((cite, i) => (
                      <div key={i} className="bg-gray-900/50 rounded p-2 border border-gray-700/50">
                        <div className="text-xs font-medium text-primary-400 mb-1">
                          [Citation {i + 1}] {cite.document_name} (Page {cite.page})
                        </div>
                        <div className="text-xs text-gray-400 italic line-clamp-2">
                          "{cite.snippet}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary-400" />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span className="text-sm text-gray-400">Searching documents...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
