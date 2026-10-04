/**
 * MAIN BOOTSTRAP MODULE - CỜ CARO (GOMOKU)
 * Kết nối các module: Game Engine, Board Renderer, UI Controller, AI, Sound, Storage và Socket.
 */

import { GomokuGame } from './game.js';
import { BoardRenderer } from './board.js';
import { UIController } from './ui.js';
import { sound } from './sound.js';
import { storage } from './storage.js';
import { getBestMove, AI_LEVELS } from './ai.js';
import { SocketManager } from './socket.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tải cấu hình từ Storage
  const settings = storage.getSettings();
  sound.setEnabled(settings.soundEnabled);

  // 2. Khởi tạo Game Engine
  const game = new GomokuGame(settings.boardSize, settings.winLength);

  // Biến quản lý chế độ chơi
  let gameMode = 'local'; // 'local' | 'ai' | 'online'
  let onlineRole = null;  // 'X' | 'O'

  // 3. Khởi tạo UI Controller
  const ui = new UIController({
    playerCardX: document.getElementById('playerCardX'),
    playerCardO: document.getElementById('playerCardO'),
    playerRoleX: document.getElementById('playerRoleX'),
    playerRoleO: document.getElementById('playerRoleO'),
    moveCountBadge: document.getElementById('moveCountBadge')
  });

  ui.applyTheme(settings.theme);

  // 4. Khởi tạo Board Renderer
  const boardElement = document.getElementById('board');
  const board = new BoardRenderer(boardElement, (row, col) => {
    handlePlayerMove(row, col);
  });

  board.buildGrid(game.size);

  // 5. Khởi tạo Socket Manager cho Multiplayer Online
  const socket = new SocketManager({
    onConnect: (roomId, role) => {
      onlineRole = role;
      updateSocketUI(true, `Phòng: ${roomId} (Bạn là quân ${role})`);
      ui.showToast(`Đã vào phòng ${roomId}! Bạn là Quân ${role}`);
      ui.updateTurn(game.getState(), gameMode, onlineRole);
      syncBoardInteractivity();
    },
    onDisconnect: () => {
      updateSocketUI(false, 'Đối thủ đã ngắt kết nối');
      ui.showToast('Đối thủ đã rời phòng!');
      syncBoardInteractivity();
    },
    onPlayerRole: (role) => {
      onlineRole = role;
      ui.updateTurn(game.getState(), gameMode, onlineRole);
      syncBoardInteractivity();
    },
    onOpponentMove: (row, col) => {
      const res = game.makeMove(row, col);
      if (res.success) {
        sound.playMove();
        handleAfterMove();
      }
    },
    onRematchRequest: () => {
      ui.showToast('Đối thủ yêu cầu chơi lại!');
      game.reset();
      syncBoardInteractivity();
    },
    onChatMessage: (data) => {
      renderChatMessage(data);
    },
    onError: (msg) => {
      ui.showToast(msg);
    }
  });

  // 6. Đăng ký lắng nghe Game Engine
  game.subscribe((state) => {
    board.update(state);
    ui.updateTurn(state, gameMode, onlineRole);
    ui.updateMoveHistory(state.moveHistory);
    updateUndoButtonState(state);
  });

  // Cập nhật trạng thái ban đầu
  board.update(game.getState());
  ui.updateTurn(game.getState(), gameMode, onlineRole);

  /**
   * XỬ LÝ NƯỚC ĐI CỦA NGƯỜI CHƠI
   */
  function handlePlayerMove(row, col) {
    const state = game.getState();

    // 1. Kiểm tra game đã kết thúc chưa
    if (state.isGameOver) return;

    // 2. Chế độ AI: Nếu đang là lượt của máy (O), không cho người chơi click
    if (gameMode === 'ai' && state.currentPlayer === 'O') return;

    // 3. Chế độ Online: Người chơi chỉ được đi khi đúng quân của mình
    if (gameMode === 'online') {
      if (!socket.isConnected) {
        ui.showToast('Bạn chưa kết nối với phòng đấu!');
        ui.openModal('roomModal');
        return;
      }
      if (onlineRole !== state.currentPlayer) {
        ui.showToast('Chưa đến lượt của bạn!');
        return;
      }
    }

    // 4. Thực hiện nước đi trên Game Engine
    const result = game.makeMove(row, col);

    if (result.success) {
      sound.playMove();

      // Nếu đang chơi Online, gửi nước đi cho đối thủ
      if (gameMode === 'online') {
        socket.sendMove(row, col);
      }

      handleAfterMove();

      // Nếu chơi với máy và game vẫn tiếp tục, kích hoạt AI
      if (gameMode === 'ai' && !game.getState().isGameOver && game.getState().currentPlayer === 'O') {
        triggerAIMove();
      }
    } else if (result.reason) {
      ui.showToast(result.reason);
    }
  }

  /**
   * Xử lý sau mỗi nước đi (Kiểm tra thắng/thua/hòa)
   */
  function handleAfterMove() {
    const state = game.getState();

    if (state.isGameOver) {
      if (state.gameStatus === 'draw') {
        sound.playDraw();
        storage.recordGameResult('draw');
      } else {
        sound.playWin();
        storage.recordGameResult(state.winner);
      }

      setTimeout(() => {
        ui.showResult(state);
      }, 400);
    }

    syncBoardInteractivity();
  }

  /**
   * Kích hoạt lượt đi của AI
   */
  function triggerAIMove() {
    board.setDisabled(true);

    // Thời gian trễ giả lập suy nghĩ (350ms - 550ms) tạo cảm giác tự nhiên
    const delay = Math.floor(Math.random() * 200) + 350;

    setTimeout(() => {
      const state = game.getState();
      if (state.isGameOver || state.currentPlayer !== 'O') {
        board.setDisabled(false);
        return;
      }

      const move = getBestMove(state, 'O', settings.aiDifficulty);

      if (move) {
        const [r, c] = move;
        const res = game.makeMove(r, c);
        if (res.success) {
          sound.playMove();
          handleAfterMove();
        }
      }

      board.setDisabled(false);
    }, delay);
  }

  /**
   * Đồng bộ trạng thái khóa/mở bàn cờ
   */
  function syncBoardInteractivity() {
    const state = game.getState();
    if (state.isGameOver) {
      board.setDisabled(true);
      return;
    }

    if (gameMode === 'online') {
      const isMyTurn = socket.isConnected && (onlineRole === state.currentPlayer);
      board.setDisabled(!isMyTurn);
    } else if (gameMode === 'ai') {
      board.setDisabled(state.currentPlayer === 'O');
    } else {
      board.setDisabled(false);
    }
  }

  function updateUndoButtonState(state) {
    const undoBtn = document.getElementById('undoBtn');
    if (!undoBtn) return;
    // Không cho undo trong chế độ Online
    if (gameMode === 'online' || state.moveCount === 0 || state.isGameOver) {
      undoBtn.disabled = true;
    } else {
      undoBtn.disabled = false;
    }
  }

  // ==========================================================================
  // SỰ KIỆN NÚT VÀ GIAO DIỆN
  // ==========================================================================

  // 1. Chuyển chế độ chơi (Tabs)
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetMode = tab.dataset.mode;
      if (targetMode === gameMode) return;

      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      gameMode = targetMode;

      const socketBadge = document.getElementById('socketBadge');
      if (gameMode === 'online') {
        socketBadge.classList.add('visible');
        if (!socket.isConnected) {
          ui.openModal('roomModal');
        }
      } else {
        socketBadge.classList.remove('visible');
      }

      game.reset();
      ui.updateTurn(game.getState(), gameMode, onlineRole);
      syncBoardInteractivity();
      sound.playClick();
    });
  });

  // 2. Nút Chơi lại (Replay)
  const handleReplay = () => {
    sound.playClick();
    game.reset();
    ui.closeAllModals();

    if (gameMode === 'online' && socket.isConnected) {
      socket.sendRematch();
    }
    syncBoardInteractivity();
  };

  document.getElementById('replayBtn').addEventListener('click', handleReplay);
  document.getElementById('modalReplayBtn').addEventListener('click', handleReplay);

  // 3. Nút Chơi mới (New Game)
  document.getElementById('newGameBtn').addEventListener('click', () => {
    sound.playClick();
    const state = game.getState();
    if (state.moveCount > 0 && !state.isGameOver) {
      ui.showConfirmNewGame(() => {
        game.reset();
        syncBoardInteractivity();
      });
    } else {
      game.reset();
      syncBoardInteractivity();
    }
  });

  // 4. Nút Hoàn tác (Undo)
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (gameMode === 'online') {
      ui.showToast('Không thể hoàn tác khi đang chơi Online!');
      return;
    }

    sound.playClick();
    if (gameMode === 'ai') {
      // Ở chế độ AI, hoàn tác 2 bước (của máy và của người)
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    syncBoardInteractivity();
  });

  // 5. Nút Âm thanh (Header)
  const soundBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundSettingToggle = document.getElementById('soundSettingToggle');

  function toggleSound(val) {
    const isEnabled = typeof val === 'boolean' ? val : !sound.enabled;
    sound.setEnabled(isEnabled);
    storage.saveSettings({ soundEnabled: isEnabled });
    soundIcon.textContent = isEnabled ? '🔊' : '🔇';
    soundSettingToggle.checked = isEnabled;
    ui.showToast(isEnabled ? 'Đã bật âm thanh' : 'Đã tắt âm thanh');
  }

  soundBtn.addEventListener('click', () => {
    toggleSound();
    sound.playClick();
  });

  soundSettingToggle.addEventListener('change', (e) => {
    toggleSound(e.target.checked);
  });

  // Cập nhật trạng thái icon ban đầu
  soundIcon.textContent = sound.enabled ? '🔊' : '🔇';
  soundSettingToggle.checked = sound.enabled;

  // 6. Nút Đổi Theme (Giao diện Sáng/Tối)
  const themeBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    ui.applyTheme(next);
    storage.saveSettings({ theme: next });
    themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
    sound.playClick();
  }

  themeBtn.addEventListener('click', toggleTheme);
  themeIcon.textContent = settings.theme === 'light' ? '☀️' : '🌙';

  // 7. Nút Hướng dẫn & Cài đặt & Lịch sử
  document.getElementById('helpBtn').addEventListener('click', () => {
    sound.playClick();
    ui.openModal('helpModal');
  });

  document.getElementById('historyBtn').addEventListener('click', () => {
    sound.playClick();
    ui.openModal('historyModal');
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    sound.playClick();
    renderStatsSummary();
    ui.openModal('settingsModal');
  });

  // Cài đặt kích thước bàn cờ
  const boardSizeSelect = document.getElementById('boardSizeSelect');
  boardSizeSelect.value = String(game.size);
  boardSizeSelect.addEventListener('change', (e) => {
    const newSize = parseInt(e.target.value, 10);
    game.setSize(newSize);
    board.buildGrid(newSize);
    storage.saveSettings({ boardSize: newSize });
    syncBoardInteractivity();
    ui.showToast(`Đã đổi bàn cờ thành ${newSize}×${newSize}`);
  });

  // Cài đặt độ khó AI
  const aiLevelSelect = document.getElementById('aiLevelSelect');
  aiLevelSelect.value = settings.aiDifficulty;
  aiLevelSelect.addEventListener('change', (e) => {
    settings.aiDifficulty = e.target.value;
    storage.saveSettings({ aiDifficulty: e.target.value });
    ui.showToast(`Độ khó AI: ${e.target.options[e.target.selectedIndex].text}`);
  });

  // Thống kê & Xóa tỉ số
  function renderStatsSummary() {
    const stats = storage.getStats();
    const box = document.getElementById('statsSummary');
    box.innerHTML = `
      Tổng trận: <strong>${stats.totalGames}</strong> | 
      X thắng: <strong style="color: var(--color-x);">${stats.xWins}</strong> | 
      O thắng: <strong style="color: var(--color-o);">${stats.oWins}</strong> | 
      Hòa: <strong>${stats.draws}</strong>
    `;
  }

  document.getElementById('resetStatsBtn').addEventListener('click', () => {
    storage.resetStats();
    renderStatsSummary();
    ui.showToast('Đã xóa dữ liệu thống kê!');
    sound.playClick();
  });

  // ==========================================================================
  // MULTIPLAYER ROOM & CHAT
  // ==========================================================================
  document.getElementById('openRoomModalBtn').addEventListener('click', () => {
    ui.openModal('roomModal');
  });

  // Tạo phòng
  document.getElementById('createRoomBtn').addEventListener('click', () => {
    sound.playClick();
    const roomId = socket.createRoom();
    document.getElementById('createdRoomInfo').style.display = 'block';
    document.getElementById('createdRoomCode').textContent = roomId;
    ui.showToast(`Đã tạo phòng ${roomId}!`);
  });

  // Sao chép mã phòng
  document.getElementById('copyRoomCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('createdRoomCode').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        ui.showToast('Đã sao chép mã phòng!');
      });
    } else {
      ui.showToast(`Mã phòng: ${code}`);
    }
  });

  // Vào phòng
  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    sound.playClick();
    const input = document.getElementById('joinRoomInput');
    const code = input.value.trim().toUpperCase();
    if (!code) {
      ui.showToast('Vui lòng nhập mã phòng!');
      return;
    }
    socket.joinRoom(code);
    ui.showToast(`Đang kết nối tới phòng ${code}...`);
  });

  // Rời phòng
  document.getElementById('leaveRoomBtn').addEventListener('click', () => {
    sound.playClick();
    socket.leaveRoom();
    onlineRole = null;
    updateSocketUI(false, 'Chưa vào phòng');
    ui.closeAllModals();
    ui.showToast('Đã rời phòng đấu');
    syncBoardInteractivity();
  });

  // Gửi Chat
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  function handleSendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    const sender = onlineRole ? `Quân ${onlineRole}` : 'Tôi';
    socket.sendChat(sender, text);
    chatInput.value = '';
  }

  chatSendBtn.addEventListener('click', handleSendChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendChat();
  });

  function renderChatMessage(msg) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    if (msg.isSystem) {
      div.className = 'chat-msg system';
      div.textContent = msg.text;
    } else {
      div.className = 'chat-msg';
      div.innerHTML = `<strong>${msg.sender}:</strong> ${escapeHtml(msg.text)}`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function updateSocketUI(connected, text) {
    const dot = document.getElementById('socketDot');
    const label = document.getElementById('socketStatusText');
    if (dot) {
      dot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    }
    if (label) {
      label.textContent = text;
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Tự động kiểm tra param ?room=... trên link (Ví dụ bạn bè gửi link kèm mã phòng)
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    // Tự động chuyển tab Online
    const onlineTab = document.querySelector('[data-mode="online"]');
    if (onlineTab) onlineTab.click();
    document.getElementById('joinRoomInput').value = roomParam;
    socket.joinRoom(roomParam);
  }
});
