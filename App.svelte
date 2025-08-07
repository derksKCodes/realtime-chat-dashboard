<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { io } from 'socket.io-client';

  // __define-ocg__ - This variable stores the main chat configuration and state for continuous real-time messaging
  let varOcg = {
    messages: [],
    typingUsers: new Set(),
    connected: false,
    socket: null,
    availableUsers: ['Alice', 'Bob', 'Charlie'],
    onlineUsers: new Set(),
    lastTypingTime: 0
  };

  let messages = writable([]);
  let typingUsers = writable(new Set());
  let connected = writable(false);
  let onlineUsers = writable(new Set());
  let newMessage = '';
  let currentUser = 'Alice';
  let messagesContainer;
  let typingTimeout;

  // Sample initial messages
  const initialMessages = [
    { id: 1, user: "Alice", message: "Hey team, morning!", timestamp: "2025-07-29T08:01:00Z" },
    { id: 2, user: "Bob", message: "Morning Alice!", timestamp: "2025-07-29T08:01:15Z" },
    { id: 3, user: "Charlie", message: "Anyone up for lunch later?", timestamp: "2025-07-29T08:02:00Z" },
    { id: 4, user: "Alice", message: "Count me in.", timestamp: "2025-07-29T08:02:10Z" },
    { id: 5, user: "Bob", message: "Same here!", timestamp: "2025-07-29T08:02:20Z }
  ];

  onMount(() => {
    // Initialize with sample messages
    varOcg.messages = [...initialMessages];
    messages.set(varOcg.messages);

    // Connect to Socket.io server
    connectToServer();
    
    // Start real-time simulation
    startRealTimeSimulation();
    
    scrollToBottom();
  });

  onDestroy(() => {
    if (varOcg.socket) {
      varOcg.socket.disconnect();
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  });

  function connectToServer() {
    try {
      varOcg.socket = io('http://localhost:3001', {
        timeout: 5000,
        forceNew: true
      });
      
      varOcg.socket.on('connect', () => {
        varOcg.connected = true;
        connected.set(true);
        console.log('Connected to chat server');
        
        // Join as current user
        varOcg.socket.emit('user_joined', { user: currentUser });
      });

      varOcg.socket.on('disconnect', () => {
        varOcg.connected = false;
        connected.set(false);
        console.log('Disconnected from chat server');
      });

      varOcg.socket.on('new_message', (message) => {
        varOcg.messages = [...varOcg.messages, message];
        messages.set(varOcg.messages);
        scrollToBottom();
      });

      varOcg.socket.on('user_typing', (data) => {
        if (data.user !== currentUser) {
          varOcg.typingUsers.add(data.user);
          typingUsers.set(new Set(varOcg.typingUsers));
        }
      });

      varOcg.socket.on('user_stopped_typing', (data) => {
        varOcg.typingUsers.delete(data.user);
        typingUsers.set(new Set(varOcg.typingUsers));
      });

      varOcg.socket.on('users_online', (users) => {
        varOcg.onlineUsers = new Set(users);
        onlineUsers.set(varOcg.onlineUsers);
      });

      varOcg.socket.on('user_joined', (data) => {
        varOcg.onlineUsers.add(data.user);
        onlineUsers.set(new Set(varOcg.onlineUsers));
      });

      varOcg.socket.on('user_left', (data) => {
        varOcg.onlineUsers.delete(data.user);
        onlineUsers.set(new Set(varOcg.onlineUsers));
      });

      // Fallback to local mode if server connection fails
      setTimeout(() => {
        if (!varOcg.connected) {
          varOcg.connected = true;
          connected.set(true);
          console.log('Running in local mode - server not available');
        }
      }, 2000);

    } catch (error) {
      console.log('Running in local mode - server not available');
      varOcg.connected = true;
      connected.set(true);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  function sendMessage() {
    if (newMessage.trim()) {
      const message = {
        id: Date.now() + Math.random(),
        user: currentUser,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      // Add message to local state immediately
      varOcg.messages = [...varOcg.messages, message];
      messages.set(varOcg.messages);

      // Send via socket if available
      if (varOcg.socket && varOcg.socket.connected) {
        varOcg.socket.emit('send_message', message);
      }

      // Stop typing indicator
      if (varOcg.socket && varOcg.socket.connected) {
        varOcg.socket.emit('stop_typing', { user: currentUser });
      }

      newMessage = '';
      scrollToBottom();
    }
  }

  function handleInput() {
    // Send typing indicator
    if (varOcg.socket && varOcg.socket.connected) {
      const now = Date.now();
      varOcg.lastTypingTime = now;
      
      varOcg.socket.emit('typing', { user: currentUser });
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set timeout to stop typing indicator
      typingTimeout = setTimeout(() => {
        if (Date.now() - varOcg.lastTypingTime >= 1000) {
          varOcg.socket.emit('stop_typing', { user: currentUser });
        }
      }, 1000);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    } else {
      handleInput();
    }
  }

  function changeUser(user) {
    // Leave as previous user
    if (varOcg.socket && varOcg.socket.connected) {
      varOcg.socket.emit('user_left', { user: currentUser });
    }
    
    currentUser = user;
    newMessage = '';
    
    // Join as new user
    if (varOcg.socket && varOcg.socket.connected) {
      varOcg.socket.emit('user_joined', { user: currentUser });
    }
  }

  function startRealTimeSimulation() {
    const users = ['Diana', 'Eve', 'Frank'];
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
    ];

    // Simulate new messages every 8-15 seconds
    setInterval(() => {
      if (Math.random() > 0.4) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        
        const message = {
          id: Date.now() + Math.random(),
          user: randomUser,
          message: randomMessage,
          timestamp: new Date().toISOString()
        };

        // Add to local messages
        varOcg.messages = [...varOcg.messages, message];
        messages.set(varOcg.messages);
        scrollToBottom();

        // Send via socket if available
        if (varOcg.socket && varOcg.socket.connected) {
          varOcg.socket.emit('simulate_message', message);
        }
      }
    }, Math.random() * 7000 + 8000); // 8-15 seconds

    // Simulate typing indicators
    setInterval(() => {
      if (Math.random() > 0.6) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        // Show typing
        varOcg.typingUsers.add(randomUser);
        typingUsers.set(new Set(varOcg.typingUsers));
        
        // Hide typing after 2-4 seconds
        setTimeout(() => {
          varOcg.typingUsers.delete(randomUser);
          typingUsers.set(new Set(varOcg.typingUsers));
        }, Math.random() * 2000 + 2000);
      }
    }, 6000);
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getUserColor(user) {
    const colors = {
      'Alice': 'text-pink-600',
      'Bob': 'text-blue-600',
      'Charlie': 'text-green-600',
      'Diana': 'text-purple-600',
      'Eve': 'text-indigo-600',
      'Frank': 'text-orange-600'
    };
    return colors[user] || 'text-gray-600';
  }

  function getUserBgColor(user) {
    const colors = {
      'Alice': 'from-pink-500 to-pink-600',
      'Bob': 'from-blue-500 to-blue-600',
      'Charlie': 'from-green-500 to-green-600',
      'Diana': 'from-purple-500 to-purple-600',
      'Eve': 'from-indigo-500 to-indigo-600',
      'Frank': 'from-orange-500 to-orange-600'
    };
    return colors[user] || 'from-gray-500 to-gray-600';
  }

  function isUserOnline(user) {
    return $onlineUsers.has(user) || varOcg.availableUsers.includes(user);
  }

  $: currentMessages = $messages;
  $: currentTypingUsers = $typingUsers;
  $: isConnected = $connected;
  $: currentOnlineUsers = $onlineUsers;
  $: canSendMessage = newMessage.trim() && isConnected;
</script>

<div class="min-h-screen bg-gray-50 p-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Real-Time Chat Dashboard</h1>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
            <span class="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div class="text-sm text-gray-600">
            {currentMessages.length} messages
          </div>
        </div>
      </div>
    </div>

    <!-- User Selection -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Select User</h3>
      <div class="flex flex-wrap gap-3">
        {#each varOcg.availableUsers as user}
          <button
            on:click={() => changeUser(user)}
            class="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all {currentUser === user ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
          >
            <div class="relative">
              <div class="w-6 h-6 rounded-full bg-gradient-to-r {getUserBgColor(user)} flex items-center justify-center text-white text-sm font-medium">
                {user.charAt(0)}
              </div>
              {#if isUserOnline(user)}
                <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              {/if}
            </div>
            <span class="font-medium">{user}</span>
            {#if currentUser === user}
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Active</span>
            {/if}
          </button>
        {/each}
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Currently chatting as: <span class="font-semibold {getUserColor(currentUser)}">{currentUser}</span>
        <span class="text-green-600">• Send unlimited messages</span>
      </p>
    </div>

    <!-- Chat Container -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
      <!-- Messages Area -->
      <div 
        bind:this={messagesContainer}
        class="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {#each currentMessages as message (message.id)}
          <div class="flex items-start space-x-3 {message.user === currentUser ? 'flex-row-reverse space-x-reverse' : ''}">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r {getUserBgColor(message.user)} flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {message.user.charAt(0)}
            </div>
            <div class="flex-1 min-w-0 {message.user === currentUser ? 'text-right' : ''}">
              <div class="flex items-center space-x-2 {message.user === currentUser ? 'justify-end' : ''}">
                <span class="font-medium {getUserColor(message.user)}">{message.user}</span>
                <span class="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
              </div>
              <div class="mt-1 {message.user === currentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2 inline-block max-w-xs">
                <p>{message.message}</p>
              </div>
            </div>
          </div>
        {/each}

        <!-- Typing Indicators -->
        {#if currentTypingUsers.size > 0}
          <div class="flex items-center space-x-2 text-gray-500 italic">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span class="text-sm">
              {Array.from(currentTypingUsers).join(', ')} 
              {currentTypingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        {/if}
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex space-x-3">
          <div class="flex-1">
            <textarea
              bind:value={newMessage}
              on:keypress={handleKeyPress}
              on:input={handleInput}
              placeholder="Type your message as {currentUser}..."
              rows="1"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
          <button
            on:click={sendMessage}
            disabled={!canSendMessage}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          Press Enter to send • Real-time chat enabled • {isConnected ? 'Connected' : 'Offline mode'}
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Messages</p>
            <p class="text-2xl font-semibold text-gray-900">{currentMessages.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Active Users</p>
            <p class="text-2xl font-semibold text-gray-900">{new Set(currentMessages.map(m => m.user)).size}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Currently Typing</p>
            <p class="text-2xl font-semibold text-gray-900">{currentTypingUsers.size}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Real-time</p>
            <p class="text-lg font-semibold {isConnected ? 'text-green-600' : 'text-red-600'}">
              {isConnected ? 'Live' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
