/**
 * SOCKET & MULTIPLAYER MODULE - CỜ CARO (GOMOKU)
 * Hỗ trợ chơi Online 2 người:
 * 1. Chơi qua WebRTC / Peer Data Socket (Chạy trực tiếp trên GitHub Pages mà không cần thuê server!)
 * 2. Hỗ trợ BroadcastChannel (Đồng bộ tức thì giữa 2 tab trình duyệt cùng máy)
 * 3. Hỗ trợ chuẩn kết nối WebSocket truyền thống nếu có Server riêng.
 */

export class SocketManager {
  constructor(callbacks = {}) {
    this.callbacks = {
      onConnect: () => {},
      onDisconnect: () => {},
      onPlayerRole: () => {}, // 'X' hoặc 'O'
      onOpponentMove: () => {},
      onRematchRequest: () => {},
      onChatMessage: () => {},
      onError: () => {},
      ...callbacks
    };

    this.role = null;         // 'X' (Host) hoặc 'O' (Guest)
    this.roomId = null;
    this.peer = null;
    this.connection = null;
    this.broadcastChannel = null;
    this.isConnected = false;
    this.isHost = false;
  }

  /**
   * Tạo mã phòng ngẫu nhiên 6 ký tự
   */
  generateRoomId() {
    return 'CARO-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  /**
   * 1. TẠO PHÒNG MỚI (Host - Người chơi X)
   */
  createRoom(customRoomId = null) {
    this.roomId = customRoomId || this.generateRoomId();
    this.isHost = true;
    this.role = 'X';

    this.initBroadcastChannel(this.roomId);
    this.initPeer(this.roomId, true);

    return this.roomId;
  }

  /**
   * 2. VÀO PHÒNG ĐÃ CÓ (Guest - Người chơi O)
   */
  joinRoom(roomId) {
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;
    this.role = 'O';

    this.initBroadcastChannel(this.roomId);
    this.initPeer(this.roomId, false);
  }

  /**
   * Kênh nội bộ đồng bộ giữa các tab trình duyệt
   */
  initBroadcastChannel(roomId) {
    if (typeof BroadcastChannel === 'undefined') return;

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    this.broadcastChannel = new BroadcastChannel(`caro_room_${roomId}`);
    this.broadcastChannel.onmessage = (event) => {
      this.handleIncomingData(event.data);
    };

    // Báo hiệu đã vào phòng
    if (!this.isHost) {
      setTimeout(() => {
        this.broadcastChannel.postMessage({ type: 'GUEST_JOINED', roomId });
        this.handleConnected('O');
      }, 300);
    }
  }

  /**
   * Khởi tạo kết nối PeerJS WebRTC P2P (Hoạt động tốt trên GitHub Pages)
   */
  initPeer(roomId, isHost) {
    // Nếu thư viện PeerJS chưa nạp từ CDN, ta vẫn hoạt động bằng BroadcastChannel
    if (typeof window.Peer === 'undefined') {
      console.warn('PeerJS library not loaded, using local BroadcastChannel.');
      if (isHost) {
        this.handleConnected('X');
      }
      return;
    }

    try {
      if (this.peer) {
        this.peer.destroy();
      }

      const peerId = isHost ? roomId : undefined;
      this.peer = new window.Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('Peer connected with ID:', id);
        if (isHost) {
          this.handleConnected('X');
        } else {
          // Kết nối đến Host
          const conn = this.peer.connect(roomId, { reliable: true });
          this.setupConnection(conn);
        }
      });

      this.peer.on('connection', (conn) => {
        // Host nhận kết nối từ Guest
        this.setupConnection(conn);
        conn.on('open', () => {
          conn.send({ type: 'ROLE_ASSIGN', role: 'O' });
          this.callbacks.onChatMessage({
            sender: 'Hệ thống',
            text: 'Đối thủ đã tham gia phòng đấu!',
            isSystem: true
          });
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS status:', err.type);
        if (err.type === 'unavailable-id') {
          this.callbacks.onError('Mã phòng này đã tồn tại hoặc đang được sử dụng.');
        }
      });
    } catch (e) {
      console.error('Peer init error:', e);
    }
  }

  setupConnection(conn) {
    this.connection = conn;

    conn.on('open', () => {
      this.handleConnected(this.role);
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.callbacks.onDisconnect();
    });
  }

  handleConnected(assignedRole) {
    this.isConnected = true;
    this.role = assignedRole || this.role;
    this.callbacks.onConnect(this.roomId, this.role);
    this.callbacks.onPlayerRole(this.role);
  }

  /**
   * Xử lý gói tin nhận được từ đối thủ
   */
  handleIncomingData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'GUEST_JOINED':
        if (this.isHost) {
          this.callbacks.onChatMessage({
            sender: 'Hệ thống',
            text: 'Đối thủ đã tham gia phòng qua tab khác!',
            isSystem: true
          });
          this.send({ type: 'ROLE_ASSIGN', role: 'O' });
        }
        break;

      case 'ROLE_ASSIGN':
        this.role = data.role;
        this.callbacks.onPlayerRole(this.role);
        break;

      case 'MOVE':
        this.callbacks.onOpponentMove(data.row, data.col);
        break;

      case 'REMATCH':
        this.callbacks.onRematchRequest();
        break;

      case 'CHAT':
        this.callbacks.onChatMessage(data);
        break;

      case 'DISCONNECT':
        this.callbacks.onDisconnect();
        break;
    }
  }

  /**
   * Gửi dữ liệu qua Socket / Peer / Broadcast
   */
  send(payload) {
    // 1. Gửi qua WebRTC Data Channel
    if (this.connection && this.connection.open) {
      this.connection.send(payload);
    }

    // 2. Gửi qua BroadcastChannel (cho cùng trình duyệt)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }
  }

  sendMove(row, col) {
    this.send({ type: 'MOVE', row, col });
  }

  sendRematch() {
    this.send({ type: 'REMATCH' });
  }

  sendChat(sender, text) {
    const payload = {
      type: 'CHAT',
      sender,
      text,
      timestamp: Date.now()
    };
    this.send(payload);
    this.callbacks.onChatMessage(payload);
  }

  leaveRoom() {
    this.send({ type: 'DISCONNECT' });
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
    if (this.broadcastChannel) this.broadcastChannel.close();

    this.isConnected = false;
    this.roomId = null;
    this.role = null;
  }
}
