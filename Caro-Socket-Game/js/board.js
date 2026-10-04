/**
 * BOARD UI MODULE - CỜ CARO (GOMOKU)
 * Quản lý việc hiển thị bàn cờ, các ô cờ, quân cờ và các hiệu ứng trực quan (nước đi cuối, chuỗi thắng).
 */

export class BoardRenderer {
  constructor(boardElement, onCellClick) {
    this.boardElement = boardElement;
    this.onCellClick = onCellClick;
    this.cellSize = 0;
    this.initEvents();
  }

  initEvents() {
    // Sử dụng Event Delegation để tối ưu hiệu năng
    this.boardElement.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.boardElement.classList.contains('disabled')) return;

      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);

      if (!isNaN(row) && !isNaN(col)) {
        this.onCellClick(row, col);
      }
    });
  }

  /**
   * Tạo khung lưới bàn cờ DOM theo kích thước
   */
  buildGrid(size) {
    document.documentElement.style.setProperty('--board-size', size);
    this.boardElement.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        fragment.appendChild(cell);
      }
    }

    this.boardElement.appendChild(fragment);
  }

  /**
   * Đồng bộ toàn bộ giao diện bàn cờ với trạng thái gameState
   */
  update(gameState) {
    const { board, size, currentPlayer, isGameOver, winningCells, lastMove } = gameState;

    // Cập nhật lớp turn để hiển thị preview quân cờ khi hover
    this.boardElement.classList.toggle('turn-x', currentPlayer === 'X' && !isGameOver);
    this.boardElement.classList.toggle('turn-o', currentPlayer === 'O' && !isGameOver);
    this.boardElement.classList.toggle('disabled', isGameOver);

    // Tạo tập hợp winning cells để tra cứu nhanh O(1)
    const winSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));

    const cells = this.boardElement.children;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      const cellValue = board[r][c];
      const coordKey = `${r},${c}`;

      // 1. Kiểm tra quân cờ
      const hasPiece = cellValue !== null;
      cell.classList.toggle('has-piece', hasPiece);

      if (hasPiece) {
        let piece = cell.querySelector('.piece');
        if (!piece) {
          piece = document.createElement('div');
          piece.className = `piece piece-${cellValue.toLowerCase()}`;
          piece.textContent = cellValue;
          cell.appendChild(piece);
        } else if (piece.textContent !== cellValue) {
          piece.className = `piece piece-${cellValue.toLowerCase()}`;
          piece.textContent = cellValue;
        }
      } else {
        cell.innerHTML = '';
        // Ghost preview khi hover ô trống
        cell.setAttribute('data-preview', currentPlayer);
      }

      // 2. Đánh dấu nước đi cuối cùng
      const isLast = lastMove && lastMove.row === r && lastMove.col === c;
      cell.classList.toggle('last-move', Boolean(isLast));

      // 3. Đánh dấu chuỗi thắng cuộc
      const isWin = winSet.has(coordKey);
      cell.classList.toggle('winning-cell', isWin);
    }
  }

  /**
   * Khóa bàn cờ (ví dụ khi đang chờ lượt đối thủ online hoặc chờ AI tính toán)
   */
  setDisabled(disabled) {
    this.boardElement.classList.toggle('disabled', Boolean(disabled));
  }
}
