const { io } = require('socket.io-client');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmUwNGM0MS1lYjgyLTQ4ZGYtYWFkMS03NWNjYjIzNDVjZDAiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc2NTcxMzM5MiwiZXhwIjoxNzY1Nzk5NzkyfQ.6L3h680z0NAoABKTNMpTw8ALcqY9FKm09r882XrUgvg';
const socket = io('http://localhost:3000/notifications', {
  query: { token },
});

socket.on('notification:new', (data) => {
  console.log('notification:new', data);
});
