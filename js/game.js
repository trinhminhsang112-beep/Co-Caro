/**
 * GAME ENGINE MODULE - CỜ CARO (GOMOKU)
 * Quản lý vòng đời trò chơi, trạng thái (state machine), lịch sử và logic nước đi.
 * Hoàn toàn tách biệt khỏi UI/DOM.
 */

import {
  DEFAULT_BOARD_SIZE,
  DEFAULT_WIN_LENGTH,
  PLAYER_X,
  PLAYER_O,
  isValidPosition,
  checkWin,
  checkDraw
} from './rules.js';

export class GomokuGame {
  constructor(size = DEFAULT_BOARD_SIZE, winLength = DEFAULT_WIN_LENGTH) {
    this.size = size;
    this.winLength = winLength;
    this.listeners = [];
    this.reset();
  }

  /**
   * Khởi tạo hoặc đặt lại trạng thái ban đầu của ván đấu
   */
  reset() {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.currentPlayer = PLAYER_X; // X luôn được quyền đi trước
    this.gameStatus = 'playing';   // 'playing' | 'X_wins' | 'O_wins' | 'draw'
    this.winner = null;
    this.moveCount = 0;
    this.moveHistory = [];
    this.winningCells = [];
    this.lastMove = null;

    this.notifyState();
    return this.getState();
  }

  /**
   * Đăng ký lắng nghe sự thay đổi trạng thái
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  notifyState() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in game listener:', err);
      }
    }
  }

  /**
   * Trả về bản sao trạng thái hiện tại (Snapshot)
   */
  getState() {
    return {
      size: this.size,
      winLength: this.winLength,
      board: this.board.map(row => [...row]),
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      winner: this.winner,
      moveCount: this.moveCount,
      moveHistory: [...this.moveHistory],
      winningCells: [...this.winningCells],
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      isGameOver: this.gameStatus !== 'playing'
    };
  }

  /**
   * Thực hiện một nước đi tại tọa độ (row, col)
   * @param {number} row 
   * @param {number} col 
   * @returns {{ success: boolean, reason?: string, state: object }}
   */
  makeMove(row, col) {
    // 1. Kiểm tra trạng thái game
    if (this.gameStatus !== 'playing') {
      return { success: false, reason: 'Game đã kết thúc', state: this.getState() };
    }

    // 2. Kiểm tra tọa độ hợp lệ
    if (!isValidPosition(this.size, row, col)) {
      return { success: false, reason: 'Tọa độ ngoài bàn cờ', state: this.getState() };
    }

    // 3. Kiểm tra ô đã có quân hay chưa
    if (this.board[row][col] !== null) {
      return { success: false, reason: 'Ô đã có quân cờ', state: this.getState() };
    }

    const player = this.currentPlayer;

    // 4. Đặt quân vào ma trận
    this.board[row][col] = player;
    this.moveCount += 1;
    this.lastMove = { row, col, player, moveNumber: this.moveCount };

    // 5. Lưu lịch sử nước đi
    this.moveHistory.push({
      moveNumber: this.moveCount,
      player,
      row,
      col,
      timestamp: Date.now()
    });

    // 6. Kiểm tra điều kiện thắng
    const winResult = checkWin(this.board, this.size, row, col, player, this.winLength);

    if (winResult.hasWon) {
      this.gameStatus = player === PLAYER_X ? 'X_wins' : 'O_wins';
      this.winner = player;
      this.winningCells = winResult.winningCells;
    } else if (checkDraw(this.size, this.moveCount)) {
      // 7. Kiểm tra hòa
      this.gameStatus = 'draw';
      this.winner = null;
    } else {
      // 8. Đổi lượt cho người chơi tiếp theo
      this.currentPlayer = player === PLAYER_X ? PLAYER_O : PLAYER_X;
    }

    this.notifyState();
    return {
      success: true,
      move: this.lastMove,
      state: this.getState()
    };
  }

  /**
   * Hoàn tác nước đi gần nhất (Undo)
   * @returns {boolean} Thành công hay không
   */
  undo() {
    if (this.moveHistory.length === 0) {
      return false;
    }

    const last = this.moveHistory.pop();
    this.board[last.row][last.col] = null;
    this.moveCount -= 1;

    // Phục hồi lượt đi
    this.currentPlayer = last.player;
    this.gameStatus = 'playing';
    this.winner = null;
    this.winningCells = [];

    // Cập nhật lại lastMove
    if (this.moveHistory.length > 0) {
      const prev = this.moveHistory[this.moveHistory.length - 1];
      this.lastMove = { row: prev.row, col: prev.col, player: prev.player, moveNumber: prev.moveNumber };
    } else {
      this.lastMove = null;
    }

    this.notifyState();
    return true;
  }

  /**
   * Thay đổi kích thước bàn cờ
   */
  setSize(newSize) {
    if (newSize >= 5 && newSize <= 25) {
      this.size = newSize;
      this.reset();
    }
  }

  /**
   * Thay đổi độ dài chuỗi thắng (mặc định là 5)
   */
  setWinLength(newLength) {
    if (newLength >= 3 && newLength <= this.size) {
      this.winLength = newLength;
      this.reset();
    }
  }
}
