/**
 * WEBSOCKET SERVER CHO CỜ CARO (TÙY CHỌN DÙNG KHI CÓ NODE.JS)
 * Quản lý phòng đấu (rooms), người chơi X/O và đồng bộ nước đi thời gian thực.
 */

const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

// Lưu trữ danh sách phòng đấu: roomId -> { host, guest, board, currentPlayer }
const rooms = new Map();

console.log(`🚀 Caro WebSocket Server đang chạy tại ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let userRoomId = null;
  let userRole = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'CREATE_ROOM': {
          const roomId = 'CARO-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          userRoomId = roomId;
          userRole = 'X';

          rooms.set(roomId, {
            host: ws,
            guest: null,
            moves: []
          });

          ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomId, role: 'X' }));
          console.log(`Phòng ${roomId} đã được tạo bởi Host (X)`);
          break;
        }

        case 'JOIN_ROOM': {
          const targetRoom = data.roomId.toUpperCase();
          const room = rooms.get(targetRoom);

          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Phòng không tồn tại!' }));
            return;
          }
          if (room.guest) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Phòng đã đủ 2 người chơi!' }));
            return;
          }

          userRoomId = targetRoom;
          userRole = 'O';
          room.guest = ws;

          ws.send(JSON.stringify({ type: 'ROOM_JOINED', roomId: targetRoom, role: 'O' }));
          room.host.send(JSON.stringify({ type: 'OPPONENT_JOINED', role: 'O' }));
          console.log(`Người chơi O đã tham gia phòng ${targetRoom}`);
          break;
        }

        case 'MOVE': {
          const room = rooms.get(userRoomId);
          if (!room) return;

          const target = ws === room.host ? room.guest : room.host;
          if (target && target.readyState === 1) {
            target.send(JSON.stringify({
              type: 'MOVE',
              row: data.row,
              col: data.col,
              player: userRole
            }));
          }
          break;
        }

        case 'CHAT': {
          const room = rooms.get(userRoomId);
          if (!room) return;

          const target = ws === room.host ? room.guest : room.host;
          if (target && target.readyState === 1) {
            target.send(JSON.stringify({
              type: 'CHAT',
              sender: userRole ? `Quân ${userRole}` : 'Ẩn danh',
              text: data.text
            }));
          }
          break;
        }

        case 'REMATCH': {
          const room = rooms.get(userRoomId);
          if (!room) return;

          const target = ws === room.host ? room.guest : room.host;
          if (target && target.readyState === 1) {
            target.send(JSON.stringify({ type: 'REMATCH' }));
          }
          break;
        }
      }
    } catch (e) {
      console.error('Lỗi xử lý gói tin WebSocket:', e);
    }
  });

  ws.on('close', () => {
    if (userRoomId && rooms.has(userRoomId)) {
      const room = rooms.get(userRoomId);
      const target = ws === room.host ? room.guest : room.host;
      if (target && target.readyState === 1) {
        target.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
      }
      rooms.delete(userRoomId);
      console.log(`Phòng ${userRoomId} đã đóng do người chơi thoát.`);
    }
  });
});
