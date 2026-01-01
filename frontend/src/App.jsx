import { useState, useEffect, useRef } from 'react';
import {
  Send, Menu, Settings, User, Bot, PlusSquare, LogOut, MessageSquare,
  Moon, Sun, Trash2, Sparkles, Mic, Paperclip, Image as ImageIcon, FileText, X
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { chatAPI } from './services/api';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ReactMarkdown from 'react-markdown';
import UserProfileModal from './components/UserProfileModal';

function ChatApp() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // New State for Voice & Files
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachment, setAttachment] = useState(null); // { type: 'image' | 'file', url: string, name: string }
  const [showProfileModal, setShowProfileModal] = useState(false);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Theme Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load Chats on Mount
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data);
    } catch (error) {
      console.error("Failed to load chats", error);
    }
  };

  const loadChat = async (chatId) => {
    try {
      setCurrentChatId(chatId);
      const response = await chatAPI.getMessages(chatId);
      const formattedMessages = response.data.map((msg, index) => ({
        id: msg._id || index,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.created_at || new Date().toISOString(),
        attachment: msg.attachment || null // Assuming backend might support this later, or we just use local state for now
      }));
      setMessages(formattedMessages);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error("Failed to load chat messages", error);
    }
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await chatAPI.deleteChat(chatId);
        setChats(prev => prev.filter(c => c._id !== chatId));
        if (currentChatId === chatId) {
          createNewChat();
        }
      } catch (error) {
        console.error("Failed to delete chat", error);
        alert("Failed to delete chat");
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, attachment]);

  // --- Voice Handling ---
  const toggleListening = () => {
    if (isListening) {
      // Stop is handled by the recognition instance normally, but we can force state off
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  // --- File Handling ---
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachment({
        type,
        name: file.name,
        url: e.target.result,
        file: file // Store actual file if we need to upload
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  // --- Send Handling ---
  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const tempId = Date.now();
    const userMessage = {
      id: tempId,
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
      attachment: attachment // Pass attachment to local state
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachment(null); // Clear attachment
    setIsTyping(true);

    try {
      // Note: Current backend might not handle file uploads yet, so we send text.
      // We append a note about the file for the AI context if needed.
      let messageToSend = userMessage.text;
      if (userMessage.attachment) {
        messageToSend += `\n[User attached a ${userMessage.attachment.type}: ${userMessage.attachment.name}]`;
      }

      const response = await chatAPI.sendMessage(messageToSend, currentChatId);
      const { chatId, message, id } = response.data;

      if (!currentChatId) {
        setCurrentChatId(chatId);
        fetchChats();
      }

      setMessages(prev => [...prev, {
        id: id,
        text: message,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Error: Could not connect to AI service.";
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `Server Error: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
      />

      {/* Profile Modal */}
      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 
        bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-white/50 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-100/50 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={createNewChat}>
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-300 to-violet-300 dark:from-cyan-500 dark:to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-pink-200 dark:shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-200">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 dark:from-cyan-300 dark:to-blue-400 bg-clip-text text-transparent">
              Chatty
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-gray-400 hover:text-yellow-500 dark:text-cyan-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300"
          >
            {darkMode ? <Sun size={20} className="drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" /> : <Moon size={20} />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewChat}
            className={`
              w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] border
              bg-gradient-to-r from-pink-200 to-violet-200 hover:from-pink-300 hover:to-violet-300 text-gray-700 border-white/50 shadow-md shadow-pink-100
              dark:bg-transparent dark:from-transparent dark:to-transparent dark:border-cyan-500/50 dark:text-cyan-400 dark:hover:bg-cyan-950/30 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
            `}
          >
            <PlusSquare size={18} />
            <span className="font-semibold tracking-wide">New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-2">Recent Chats</div>
          {chats.map(chat => (
            <div key={chat._id} className="relative group">
              <button
                onClick={() => loadChat(chat._id)}
                className={`w-full text-left p-3.5 pr-9 rounded-xl flex items-center space-x-3 transition-all duration-200 border
                   ${currentChatId === chat._id
                    ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-cyan-400 border-violet-100 dark:border-cyan-900/50 shadow-sm'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                 `}
              >
                <MessageSquare size={18} className={`flex-shrink-0 ${currentChatId === chat._id ? 'text-violet-500 dark:text-cyan-500' : 'text-gray-400 dark:text-gray-600'}`} />
                <span className="truncate text-sm font-medium">{chat.title || "Untitled Conversation"}</span>
              </button>
              <button
                onClick={(e) => deleteChat(e, chat._id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-rose-500 dark:text-gray-600 dark:hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-red-900/20"
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100/50 dark:border-gray-800 bg-white/30 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowProfileModal(true)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-white shadow-md overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                  {user?.preferred_name || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
        {/* Decorative Background Elements */}
        {!darkMode ? (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse"></div>
          </>
        )}

        {/* Header */}
        <header className="h-20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-white/60 dark:border-gray-800 flex items-center px-6 justify-between z-10">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight">
                {currentChatId ? (chats.find(c => c._id === currentChatId)?.title || "Chatty") : "New Chat"}
              </span>
              <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full mr-2 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
          <button className="p-2.5 text-gray-400 hover:text-violet-500 dark:hover:text-cyan-400 rounded-full hover:bg-white/50 dark:hover:bg-gray-800 transition-colors">
            <Settings size={20} />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80 animate-fade-in-up">
              <div className="w-24 h-24 bg-gradient-to-tr from-rose-100 to-indigo-100 dark:from-gray-800 dark:to-gray-800 rounded-3xl flex items-center justify-center text-indigo-400 dark:text-cyan-500 shadow-xl shadow-indigo-100/50 dark:shadow-cyan-900/20 mb-2">
                <Bot size={48} className="drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Chatty
                </h3>
                <p className="text-gray-400 dark:text-gray-500 mt-2 max-w-sm mx-auto">
                  Your friendly AI assistant.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group max-w-full`}>
              <div className={`flex items-end max-w-[85%] md:max-w-3xl space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mb-1
                  ${msg.sender === 'ai'
                    ? 'bg-gradient-to-tr from-pink-300 to-violet-400 dark:from-gray-800 dark:to-gray-700 text-white dark:text-cyan-400 border border-white dark:border-gray-600'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-600'}
                `}>
                  {msg.sender === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Bubble */}
                <div className={`
                  p-5 rounded-2xl shadow-sm transition-all duration-200 relative overflow-hidden
                  ${msg.sender === 'user'
                    ? 'bg-gradient-to-br from-indigo-200 to-violet-200 text-indigo-900 rounded-br-sm shadow-indigo-100 dark:bg-none dark:bg-cyan-900/20 dark:text-cyan-100 dark:border dark:border-cyan-500/40 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-bl-sm border border-white dark:border-gray-800 shadow-md shadow-gray-100/50 dark:shadow-none dark:border-l-4 dark:border-l-purple-500'}
                `}>

                  {/* Attachment Display in Bubble */}
                  {msg.attachment && (
                    <div className="mb-3 p-3 rounded-lg bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10 flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 dark:bg-cyan-900/50 rounded-lg text-indigo-600 dark:text-cyan-400">
                        {msg.attachment.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate opacity-80">{msg.attachment.name}</p>
                        <p className="text-[10px] opacity-60 uppercase">{msg.attachment.type}</p>
                      </div>
                      {msg.attachment.type === 'image' && msg.attachment.url && (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                          <img src={msg.attachment.url} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 dark:prose-pre:bg-gray-950/50 prose-pre:border prose-pre:border-gray-200/50 dark:prose-pre:border-gray-800 prose-pre:rounded-xl">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={`text-[10px] mt-2 flex items-center space-x-2 opacity-0 group-hover:opacity-60 transition-opacity ${msg.sender === 'user' ? 'text-indigo-900 justify-end' : 'text-gray-400'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-pink-300 to-violet-400 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center text-white dark:text-cyan-400 mb-1 shadow-sm">
                  <Bot size={18} />
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl rounded-bl-sm border border-white dark:border-gray-800 shadow-md">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-pink-400 dark:bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-400 dark:bg-cyan-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-pink-400 dark:bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md">
          <div className="max-w-4xl mx-auto relative group">

            {/* Attachment Preview (Before Sending) */}
            {attachment && (
              <div className="absolute -top-14 left-0 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center space-x-3 animate-fade-in-up">
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {attachment.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[150px] truncate">{attachment.name}</span>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attach Menu */}
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col w-32 animate-fade-in-up z-20">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 transition-colors text-sm font-medium"
                >
                  <ImageIcon size={18} className="text-pink-500 dark:text-cyan-500" />
                  <span>Image</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 transition-colors text-sm font-medium"
                >
                  <FileText size={18} className="text-violet-500 dark:text-purple-500" />
                  <span>File</span>
                </button>
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isListening ? "Listening..." : "Type a message..."}
              className={`
                w-full p-4 pl-14 pr-24 min-h-[60px] max-h-[200px] resize-none rounded-2xl outline-none transition-all duration-300
                bg-white/80 border-2 border-white focus:border-pink-200 focus:shadow-[0_0_20px_rgba(244,114,182,0.15)] text-gray-700 placeholder-gray-400
                dark:bg-gray-950 dark:border-gray-800 dark:focus:border-cyan-500/50 dark:text-gray-100 dark:placeholder-gray-600 dark:focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]
              `}
              rows={1}
            />

            {/* Attach Button (Left) */}
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="absolute left-3 bottom-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Paperclip size={20} />
            </button>

            {/* Right Logic (Mic + Send) */}
            <div className="absolute right-2 bottom-2 flex space-x-1">
              <button
                onClick={toggleListening}
                className={`
                   p-2.5 rounded-xl transition-all duration-200 
                   ${isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'}
                 `}
                title="Voice Input"
              >
                <Mic size={20} />
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() && !attachment}
                className={`
                   p-2.5 rounded-xl transition-all duration-200 transform active:scale-95
                   ${(!input.trim() && !attachment)
                    ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-400 to-violet-400 text-white shadow-lg shadow-pink-300/40 hover:shadow-pink-300/60 dark:from-cyan-600 dark:to-blue-600 dark:shadow-cyan-500/30 dark:hover:shadow-cyan-500/50'}
                 `}
              >
                <Send size={20} fill="currentColor" />
              </button>
            </div>

          </div>
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-3 font-medium tracking-wide uppercase">
            AI can make mistakes • Check important info
          </p>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login');

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-rose-50 dark:bg-gray-950 text-pink-300 dark:text-cyan-600">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
    </div>;
  }

  if (!user) {
    return view === 'login'
      ? <Login onRegisterClick={() => setView('register')} />
      : <Register onLoginClick={() => setView('login')} />;
  }

  return <ChatApp />;
}

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
