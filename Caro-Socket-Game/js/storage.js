/**
 * STORAGE MODULE - CỜ CARO
 * Quản lý cấu hình, lưu trữ thống kê ván đấu và theme vào LocalStorage.
 */

const STORAGE_KEYS = {
  SETTINGS: 'caro_game_settings',
  STATS: 'caro_game_stats'
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  theme: 'dark',
  boardSize: 15,
  winLength: 5,
  aiDifficulty: 'medium'
};

const DEFAULT_STATS = {
  xWins: 0,
  oWins: 0,
  draws: 0,
  totalGames: 0
};

export const storage = {
  /**
   * Lấy cài đặt người dùng
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Lưu cài đặt
   */
  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Cannot save to localStorage:', e);
      return newSettings;
    }
  },

  /**
   * Lấy thống kê tỉ số
   */
  getStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : { ...DEFAULT_STATS };
    } catch {
      return { ...DEFAULT_STATS };
    }
  },

  /**
   * Ghi nhận kết quả ván đấu
   */
  recordGameResult(winner) {
    const stats = this.getStats();
    stats.totalGames += 1;
    if (winner === 'X') {
      stats.xWins += 1;
    } else if (winner === 'O') {
      stats.oWins += 1;
    } else {
      stats.draws += 1;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Cannot save stats:', e);
    }
    return stats;
  },

  /**
   * Xóa thống kê
   */
  resetStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS));
    } catch (e) {
      console.warn('Cannot reset stats:', e);
    }
    return { ...DEFAULT_STATS };
  }
};
