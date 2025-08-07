'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// __define-ocg__ - This variable stores the main chat configuration and state for continuous real-time messaging
let varOcg = {
  messages: [] as Message[],
  typingUsers: new Set<string>(),
  connected: false,
  socket: null as any,
  availableUsers: ['Alice', 'Bob', 'Charlie'],
  onlineUsers: new Set<string>(),
  lastTypingTime: 0
}

interface Message {
  id: number
  user: string
  message: string
  timestamp: string
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [connected, setConnected] = useState(true) // Start as connected for demo
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState('Alice')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Sample initial messages
  const initialMessages: Message[] = [
    { id: 1, user: "Alice", message: "Hey team, morning!", timestamp: "2025-01-08T08:01:00Z" },
    { id: 2, user: "Bob", message: "Morning Alice!", timestamp: "2025-01-08T08:01:15Z" },
    { id: 3, user: "Charlie", message: "Anyone up for lunch later?", timestamp: "2025-01-08T08:02:00Z" },
    { id: 4, user: "Alice", message: "Count me in.", timestamp: "2025-01-08T08:02:10Z" },
    { id: 5, user: "Bob", message: "Same here!", timestamp: "2025-01-08T08:02:20Z" }
  ]

  useEffect(() => {
    // Initialize with sample messages
    varOcg.messages = [...initialMessages]
    setMessages(varOcg.messages)
    
    // Start real-time simulation for demo
    startRealTimeSimulation()
    
    scrollToBottom()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now() + Math.random(),
        user: currentUser,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }

      // Add message to local state
      varOcg.messages = [...varOcg.messages, message]
      setMessages([...varOcg.messages])

      setNewMessage('')
      scrollToBottom()
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    } else if (event.key !== 'Enter') {
      // Simulate typing indicator
      if (Math.random() > 0.7) {
        const otherUsers = varOcg.availableUsers.filter(u => u !== currentUser)
        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)]
        
        varOcg.typingUsers.add(randomUser)
        setTypingUsers(new Set(varOcg.typingUsers))
        
        setTimeout(() => {
          varOcg.typingUsers.delete(randomUser)
          setTypingUsers(new Set(varOcg.typingUsers))
        }, 2000)
      }
    }
  }

  const changeUser = (user: string) => {
    setCurrentUser(user)
    setNewMessage('')
  }

  const startRealTimeSimulation = () => {
    const users = ['Diana', 'Eve', 'Frank']
    const sampleMessages = [
      'How is everyone doing today?',
      'Great weather outside!',
      'Anyone working on interesting projects?',
      'Let\'s catch up later this week',
      'Thanks for the update!',
      'Sounds good to me',
      'I agree with that approach',
      'Let me check and get back to you',
      'Perfect timing!',
      'That makes sense',
      'Good point!',
      'I\'ll look into that',
      'Awesome work team!',
      'See you all later',
      'Have a great day!'
    ]

    // Simulate new messages every 10-20 seconds
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)]
        
        const message: Message = {
          id: Date.now() + Math.random(),
          user: randomUser,
          message: randomMessage,
          timestamp: new Date().toISOString()
        }

        varOcg.messages = [...varOcg.messages, message]
        setMessages([...varOcg.messages])
        scrollToBottom()
      }
    }, Math.random() * 10000 + 10000) // 10-20 seconds

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        
        varOcg.typingUsers.add(randomUser)
        setTypingUsers(new Set(varOcg.typingUsers))
        
        setTimeout(() => {
          varOcg.typingUsers.delete(randomUser)
          setTypingUsers(new Set(varOcg.typingUsers))
        }, Math.random() * 3000 + 2000)
      }
    }, 8000)

    // Cleanup intervals on unmount
    return () => {
      clearInterval(messageInterval)
      clearInterval(typingInterval)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserColor = (user: string) => {
    const colors: Record<string, string> = {
      'Alice': 'text-pink-600',
      'Bob': 'text-blue-600',
      'Charlie': 'text-green-600',
      'Diana': 'text-purple-600',
      'Eve': 'text-indigo-600',
      'Frank': 'text-orange-600'
    }
    return colors[user] || 'text-gray-600'
  }

  const getUserBgColor = (user: string) => {
    const colors: Record<string, string> = {
      'Alice': 'from-pink-500 to-pink-600',
      'Bob': 'from-blue-500 to-blue-600',
      'Charlie': 'from-green-500 to-green-600',
      'Diana': 'from-purple-500 to-purple-600',
      'Eve': 'from-indigo-500 to-indigo-600',
      'Frank': 'from-orange-500 to-orange-600'
    }
    return colors[user] || 'from-gray-500 to-gray-600'
  }

  const canSendMessage = newMessage.trim() && connected

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Real-Time Chat Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {messages.length} messages
              </div>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Select User</h3>
          <div className="flex flex-wrap gap-3">
            {varOcg.availableUsers.map((user) => (
              <button
                key={user}
                onClick={() => changeUser(user)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  currentUser === user 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getUserBgColor(user)} flex items-center justify-center text-white text-sm font-medium`}>
                    {user.charAt(0)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="font-medium">{user}</span>
                {currentUser === user && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Active</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Currently chatting as: <span className={`font-semibold ${getUserColor(currentUser)}`}>{currentUser}</span>
            <span className="text-green-600"> • Send unlimited messages</span>
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start space-x-3 ${message.user === currentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getUserBgColor(message.user)} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
                  {message.user.charAt(0)}
                </div>
                <div className={`flex-1 min-w-0 ${message.user === currentUser ? 'text-right' : ''}`}>
                  <div className={`flex items-center space-x-2 ${message.user === currentUser ? 'justify-end' : ''}`}>
                    <span className={`font-medium ${getUserColor(message.user)}`}>{message.user}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className={`mt-1 ${message.user === currentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2 inline-block max-w-xs`}>
                    <p>{message.message}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 italic">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">
                  {Array.from(typingUsers).join(', ')} 
                  {typingUsers.size === 1 ? ' is' : ' are'} typing...
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type your message as ${currentUser}...`}
                  rows={1}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!canSendMessage}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to send • Real-time chat enabled • {connected ? 'Connected' : 'Offline mode'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{new Set(messages.map(m => m.user)).size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Currently Typing</p>
                <p className="text-2xl font-semibold text-gray-900">{typingUsers.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Real-time</p>
                <p className={`text-lg font-semibold ${connected ? 'text-green-600' : 'text-red-600'}`}>
                  {connected ? 'Live' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
