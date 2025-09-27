/*
 * Простой сигнальный сервер для WebRTC на основе WebSocket.
 */

const WebSocket = require('ws');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Ассоциируем ID комнаты со списком подключений
const rooms = {};

wss.on('connection', (socket) => {
  socket.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Некорректное JSON сообщение:', message);
      return;
    }
    const { type, room } = data;
    if (!room) return;
    if (!rooms[room]) rooms[room] = [];
    switch (type) {
      case 'join':
        socket.room = room;
        rooms[room].push(socket);
        break;
      case 'offer':
      case 'answer':
      case 'candidate':
        rooms[room].forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
        break;
      default:
        console.warn('Неизвестный тип сообщения:', data.type);
    }
  });

  socket.on('close', () => {
    const room = socket.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== socket);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});

console.log(`Сигнальный сервер запущен на порту ${port}`);
