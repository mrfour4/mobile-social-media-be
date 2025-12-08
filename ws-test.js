// ws-test.js
import { io } from 'socket.io-client';

// accessToken_user1 lấy từ login
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjJkYWExZC05NzJhLTRlMDQtYmVlZS00YTJlMjM0ZDZjMjgiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc2NTE5NjUzNCwiZXhwIjoxNzY1MjgyOTM0fQ.gYXGsR4ChW4I1v-lMcoHhlR7tHfx0f2cduG3DdLj2oo';

const socket = io('http://localhost:3000/chat', {
  query: { token },
});

socket.on('connect', () => {
  console.log('Connected, id =', socket.id);

  // Join một conversation (DIRECT hoặc GROUP)
  socket.emit('join_conversation', {
    conversationId: '38ec5495-5a98-4558-897c-c7a2fb3d0498',
  });

  // Gửi message qua WS
  socket.emit('send_message', {
    conversationId: '38ec5495-5a98-4558-897c-c7a2fb3d0498',
    type: 'TEXT',
    content: 'Hello via WS from user1',
  });
});

socket.on('message', (msg) => {
  console.log('New message:', msg);
});

socket.on('message_read', (data) => {
  console.log('Message read:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Connect error:', err.message);
});
