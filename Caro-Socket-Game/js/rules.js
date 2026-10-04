/**
 * RULES MODULE - CỜ CARO (GOMOKU)
 * Quản lý luật chơi, kiểm tra 4 hướng thắng (ngang, dọc, 2 đường chéo) và kiểm tra hòa.
 * Hoàn toàn độc lập với UI/DOM.
 */

export const DEFAULT_BOARD_SIZE = 15;
export const DEFAULT_WIN_LENGTH = 5;
export const PLAYER_X = "X";
export const PLAYER_O = "O";

// 4 Hướng kiểm tra: [hàng, cột]
// 1. Ngang (0, 1)
// 2. Dọc (1, 0)
// 3. Chéo chính \ (1, 1)
// 4. Chéo phụ / (1, -1)
export const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

/**
 * Kiểm tra tọa độ có nằm trong phạm vi bàn cờ hay không
 */
export function isValidPosition(size, row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/**
 * Đếm số quân liên tiếp theo 1 hướng (cả 2 chiều xuôi và ngược)
 * @param {Array<Array<string|null>>} board - Ma trận bàn cờ
 * @param {number} size - Kích thước bàn cờ (ví dụ 15)
 * @param {number} row - Tọa độ hàng vừa đánh
 * @param {number} col - Tọa độ cột vừa đánh
 * @param {number} dr - Độ lệch hàng (delta row)
 * @param {number} dc - Độ lệch cột (delta col)
 * @param {string} player - Quân hiện tại ("X" hoặc "O")
 * @returns {{ count: number, cells: Array<[number, number]> }}
 */
export function checkDirection(board, size, row, col, dr, dc, player) {
  const cells = [[row, col]];

  // Chiều xuôi (tiến)
  let r = row + dr;
  let c = col + dc;
  while (isValidPosition(size, r, c) && board[r][c] === player) {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }

  // Chiều ngược (lùi)
  r = row - dr;
  c = col - dc;
  while (isValidPosition(size, r, c) && board[r][c] === player) {
    cells.unshift([r, c]);
    r -= dr;
    c -= dc;
  }

  return {
    count: cells.length,
    cells
  };
}

/**
 * Kiểm tra xem nước đi vừa rồi có đem lại chiến thắng hay không
 * @param {Array<Array<string|null>>} board 
 * @param {number} size 
 * @param {number} row 
 * @param {number} col 
 * @param {string} player 
 * @param {number} winLength 
 * @returns {{ hasWon: boolean, winningCells: Array<[number, number]> }}
 */
export function checkWin(board, size, row, col, player, winLength = DEFAULT_WIN_LENGTH) {
  if (!player || !isValidPosition(size, row, col)) {
    return { hasWon: false, winningCells: [] };
  }

  for (const [dr, dc] of DIRECTIONS) {
    const { count, cells } = checkDirection(board, size, row, col, dr, dc, player);
    if (count >= winLength) {
      return {
        hasWon: true,
        winningCells: cells
      };
    }
  }

  return {
    hasWon: false,
    winningCells: []
  };
}

/**
 * Kiểm tra xem bàn cờ đã đầy (hòa) hay chưa
 */
export function checkDraw(size, moveCount) {
  return moveCount >= size * size;
}
