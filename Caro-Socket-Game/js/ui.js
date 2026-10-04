/**
 * UI CONTROLLER MODULE - CỜ CARO (GOMOKU)
 * Quản lý các thành phần giao diện người dùng, thông báo, thẻ lượt chơi, modals và toasts.
 */

export class UIController {
  constructor(elements, handlers = {}) {
    this.elements = elements;
    this.handlers = handlers;
    this.initEventListeners();
  }

  initEventListeners() {
    // Đóng modal khi bấm vào nút close hoặc bấm ra ngoài nền mờ
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('.modal-close-btn')) {
          this.closeAllModals();
        }
      });
    });

    // Thoát modal bằng phím Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * Cập nhật thông tin thẻ người chơi và lượt đi
   */
  updateTurn(gameState, gameMode, onlineRole = null) {
    const { currentPlayer, isGameOver, moveCount } = gameState;

    // Cập nhật số nước đi
    if (this.elements.moveCountBadge) {
      this.elements.moveCountBadge.textContent = moveCount;
    }

    // Cập nhật active card
    if (this.elements.playerCardX && this.elements.playerCardO) {
      this.elements.playerCardX.classList.toggle('active', currentPlayer === 'X' && !isGameOver);
      this.elements.playerCardO.classList.toggle('active', currentPlayer === 'O' && !isGameOver);
    }

    // Nhãn vai trò người chơi
    if (this.elements.playerRoleX && this.elements.playerRoleO) {
      if (gameMode === 'ai') {
        this.elements.playerRoleX.textContent = 'Bạn (Người chơi)';
        this.elements.playerRoleO.textContent = 'Máy (AI)';
      } else if (gameMode === 'online') {
        this.elements.playerRoleX.textContent = onlineRole === 'X' ? 'Bạn (Chủ phòng)' : 'Đối thủ (Chủ phòng)';
        this.elements.playerRoleO.textContent = onlineRole === 'O' ? 'Bạn (Khách)' : 'Đối thủ (Khách)';
      } else {
        this.elements.playerRoleX.textContent = 'Người chơi 1 (Đi trước)';
        this.elements.playerRoleO.textContent = 'Người chơi 2';
      }
    }
  }

  /**
   * Hiển thị bảng kết quả khi trận đấu kết thúc
   */
  showResult(gameState) {
    const { gameStatus, winner, moveCount } = gameState;
    const modal = document.getElementById('resultModal');
    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const desc = document.getElementById('resultDesc');

    if (!modal) return;

    if (gameStatus === 'draw') {
      icon.textContent = '🤝';
      title.textContent = 'Trận đấu Hòa!';
      desc.textContent = `Bàn cờ đã đầy sau ${moveCount} nước đi mà không bên nào đạt 5 quân liên tiếp.`;
    } else {
      icon.textContent = '🎉';
      title.textContent = `Người chơi ${winner} đã chiến thắng!`;
      desc.textContent = `Hoàn thành xuất sắc sau ${moveCount} nước đi.`;
    }

    modal.classList.add('active');
  }

  /**
   * Mở modal xác nhận ván mới nếu đang đánh dở
   */
  showConfirmNewGame(onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    const confirmBtn = document.getElementById('confirmNewGameBtn');
    const cancelBtn = document.getElementById('cancelNewGameBtn');

    const handleConfirm = () => {
      modal.classList.remove('active');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      onConfirm();
    };

    const handleCancel = () => {
      modal.classList.remove('active');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    modal.classList.add('active');
  }

  /**
   * Cập nhật danh sách lịch sử nước đi
   */
  updateMoveHistory(history) {
    const list = document.getElementById('historyList');
    if (!list) return;

    if (history.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có nước đi nào</div>';
      return;
    }

    list.innerHTML = '';
    const fragment = document.createDocumentFragment();

    history.forEach((m) => {
      const item = document.createElement('div');
      item.className = `history-item player-${m.player.toLowerCase()}`;
      item.innerHTML = `
        <span>#${m.moveNumber} Quân ${m.player}</span>
        <span>Hàng ${m.row + 1}, Cột ${m.col + 1}</span>
      `;
      fragment.appendChild(item);
    });

    list.appendChild(fragment);
    list.scrollTop = list.scrollHeight;
  }

  /**
   * Đóng tất cả các popup / modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  /**
   * Mở modal theo ID
   */
  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Hiển thị thông báo Toast nhanh
   */
  showToast(message, duration = 2500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Áp dụng Theme (dark/light)
   */
  applyTheme(theme) {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
