/**
 * AI ENGINE MODULE - CỜ CARO (GOMOKU)
 * Cung cấp 3 cấp độ: Dễ (Easy), Trung bình (Medium), Khó (Hard).
 * Sử dụng phân tích thế cờ đe dọa (Threat Detection) và hàm lượng giá (Heuristic Evaluation).
 */

import { DIRECTIONS, isValidPosition } from './rules.js';

export const AI_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

/**
 * Lấy danh sách các ô trống xung quanh những ô đã có quân (bán kính 2 ô)
 * Giúp tối ưu hóa phạm vi tìm kiếm thay vì duyệt cả 225 ô.
 */
function getCandidateCells(board, size) {
  const candidates = new Set();
  let hasPieces = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== null) {
        hasPieces = true;
        // Quét bán kính 2 ô xung quanh
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (isValidPosition(size, nr, nc) && board[nr][nc] === null) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  // Nếu bàn cờ hoàn toàn trống, ưu tiên ô trung tâm
  if (!hasPieces) {
    const center = Math.floor(size / 2);
    return [[center, center]];
  }

  return Array.from(candidates).map(coord => coord.split(',').map(Number));
}

/**
 * Đánh giá điểm số của một ô đối với 1 người chơi theo 4 hướng
 */
function evaluateCell(board, size, row, col, player, winLength = 5) {
  let totalScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // Tiến theo chiều xuôi
    let r = row + dr;
    let c = col + dc;
    while (isValidPosition(size, r, c) && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (isValidPosition(size, r, c) && board[r][c] === null) {
      openEnds++;
    }

    // Lùi theo chiều ngược
    r = row - dr;
    c = col - dc;
    while (isValidPosition(size, r, c) && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (isValidPosition(size, r, c) && board[r][c] === null) {
      openEnds++;
    }

    // Tính điểm dựa trên số quân và số đầu mở
    if (count >= winLength) {
      totalScore += 100000; // Thắng ngay lập tức
    } else if (count === 4) {
      if (openEnds === 2) totalScore += 15000; // Mở 2 đầu -> chắc chắn thắng
      else if (openEnds === 1) totalScore += 3000;
    } else if (count === 3) {
      if (openEnds === 2) totalScore += 2500;
      else if (openEnds === 1) totalScore += 500;
    } else if (count === 2) {
      if (openEnds === 2) totalScore += 300;
      else if (openEnds === 1) totalScore += 60;
    } else if (count === 1) {
      if (openEnds === 2) totalScore += 15;
    }
  }

  // Khuyến khích kiểm soát khu vực trung tâm
  const center = size / 2;
  const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
  totalScore += Math.max(0, 15 - distFromCenter);

  return totalScore;
}

/**
 * Tìm nước đi tốt nhất cho AI
 * @param {object} gameState - Trạng thái trò chơi từ GomokuGame
 * @param {string} aiPlayer - 'O' hoặc 'X'
 * @param {string} level - 'easy' | 'medium' | 'hard'
 * @returns {[number, number]|null} [row, col]
 */
export function getBestMove(gameState, aiPlayer = 'O', level = AI_LEVELS.MEDIUM) {
  const { board, size, winLength } = gameState;
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  const candidates = getCandidateCells(board, size);

  if (candidates.length === 0) return null;

  // 1. Chế độ DỄ: Đi ngẫu nhiên trong danh sách các ô ứng viên
  if (level === AI_LEVELS.EASY) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  // 2. Chế độ TRUNG BÌNH & KHÓ: Tính toán nước thắng và nước chặn đối thủ
  let bestMove = candidates[0];
  let maxScore = -Infinity;

  for (const [row, col] of candidates) {
    const attackScore = evaluateCell(board, size, row, col, aiPlayer, winLength);
    const defenseScore = evaluateCell(board, size, row, col, opponent, winLength);

    let score = 0;

    if (level === AI_LEVELS.MEDIUM) {
      // Ưu tiên thắng ngay lập tức
      if (attackScore >= 100000) return [row, col];
      // Nếu đối thủ sắp thắng, lập tức chặn
      if (defenseScore >= 100000) return [row, col];

      score = attackScore + defenseScore * 0.9 + Math.random() * 50;
    } else {
      // Chế độ KHÓ (HARD): Đánh giá chính xác theo trọng số chiến thuật
      if (attackScore >= 100000) return [row, col];
      if (defenseScore >= 100000) return [row, col];

      // Đòn 4 hở 2 đầu là không thể chặn, phải chặn sớm
      if (defenseScore >= 15000) score = defenseScore * 1.5;
      else if (attackScore >= 15000) score = attackScore * 1.4;
      else {
        score = attackScore * 1.15 + defenseScore * 1.0;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMove = [row, col];
    }
  }

  return bestMove;
}
