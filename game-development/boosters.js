/*
 * OK Kacis - Optional powerups game engine.
 * Isolated: this module does not modify the current release game until integrated.
 * Adapter contract: getBoard(), setBoard(board), canCommit(board), onPowerup(result).
 * A board is a rectangular grid of null or {type, direction?, locked?, protected?}.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.OkKacisPowerups = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const DIRECTIONS = ["up", "right", "down", "left"];
  const POWERUPS = Object.freeze(["hammer", "bomb", "lightning", "rotate"]);
  const LEVEL_START = 6;

  function difficultyFor(level) {
    const n = Math.max(1, Math.trunc(Number(level) || 1));
    if (n <= 5) return { tier: 0, boardSize: 4, minArrows: 4 + n, extraObstacles: 0, specialTiles: 0, comboEnabled: false };
    if (n <= 10) return { tier: 1, boardSize: 4, minArrows: 10 + Math.floor((n - 6) / 2), extraObstacles: 1, specialTiles: 1, comboEnabled: true };
    if (n <= 20) return { tier: 2, boardSize: 5, minArrows: 13 + Math.floor((n - 11) / 3), extraObstacles: 2, specialTiles: 1, comboEnabled: true };
    if (n <= 40) return { tier: 3, boardSize: 6, minArrows: 18 + Math.floor((n - 21) / 5), extraObstacles: 3, specialTiles: 2, comboEnabled: true };
    if (n <= 80) return { tier: 4, boardSize: 7, minArrows: 25 + Math.floor((n - 41) / 8), extraObstacles: 4, specialTiles: 2, comboEnabled: true };
    return { tier: 5, boardSize: 8, minArrows: Math.min(50, 32 + Math.floor((n - 81) / 15)), extraObstacles: Math.min(8, 5 + Math.floor((n - 81) / 60)), specialTiles: 3, comboEnabled: true };
  }

  function validBoard(board) {
    return Array.isArray(board) && board.length > 0 &&
      Array.isArray(board[0]) && board[0].length > 0 &&
      board.every(row => Array.isArray(row) && row.length === board[0].length);
  }

  function cloneBoard(board) {
    return board.map(row => row.map(cell => cell && typeof cell === "object" ? { ...cell } : cell));
  }

  function canRemove(cell) {
    return !!cell && typeof cell === "object" &&
      !cell.locked && !cell.protected && cell.type !== "exit" && cell.type !== "key";
  }

  function canRotate(cell) {
    return !!cell && cell.type === "arrow" && !cell.locked && !cell.protected &&
      DIRECTIONS.includes(cell.direction);
  }

  function chooseAffected(board, powerup, row, col) {
    const h = board.length, w = board[0].length;
    const result = [];
    const push = (r, c) => {
      if (r < 0 || r >= h || c < 0 || c >= w) return;
      if (canRemove(board[r][c])) result.push([r, c]);
    };
    if (powerup === "hammer") push(row, col);
    if (powerup === "bomb") {
      for (let r = row - 1; r <= row + 1; r++)
        for (let c = col - 1; c <= col + 1; c++) push(r, c);
    }
    if (powerup === "lightning") {
      for (let c = 0; c < w; c++) push(row, c);
    }
    return result;
  }

  function preview(board, booster, position, options) {
    const opts = options || {};
    const level = Number(opts.level || LEVEL_START);
    if (level < LEVEL_START) return { ok: false, reason: "not-unlocked" };
    if (!validBoard(board)) return { ok: false, reason: "invalid-board" };
    if (!POWERUPS.includes(booster)) return { ok: false, reason: "unknown-powerup" };
    const row = Number(position && position.row), col = Number(position && position.col);
    if (!Number.isInteger(row) || !Number.isInteger(col) ||
        row < 0 || row >= board.length || col < 0 || col >= board[0].length)
      return { ok: false, reason: "invalid-target" };
    const next = cloneBoard(board);
    let affected = [];
    if (booster === "rotate") {
      const cell = next[row][col];
      if (!canRotate(cell)) return { ok: false, reason: "not-rotatable" };
      cell.direction = DIRECTIONS[(DIRECTIONS.indexOf(cell.direction) + 1) % DIRECTIONS.length];
      affected = [[row, col]];
    } else {
      affected = chooseAffected(next, booster, row, col);
      if (booster === "hammer" && !(next[row][col] && canRemove(next[row][col])))
        return { ok: false, reason: "not-removable" };
      if (!affected.length) return { ok: false, reason: "no-effect" };
      for (const [r, c] of affected) next[r][c] = null;
    }
    // The host puzzle engine can reject any resulting state that would be unsolvable.
    if (typeof opts.canCommit === "function" && !opts.canCommit(next, board, booster))
      return { ok: false, reason: "puzzle-state-rejected" };
    return { ok: true, board: next, affected, booster };
  }

  function createInventory(saved) {
    const result = Object.create(null);
    for (const key of POWERUPS) result[key] = Math.max(0, Math.trunc(Number(saved && saved[key]) || 0));
    return result;
  }
  function inventoryCopy(inv) { return { hammer:inv.hammer || 0, bomb:inv.bomb || 0, lightning:inv.lightning || 0, rotate:inv.rotate || 0 }; }

  function createController(adapter, config) {
    if (!adapter || typeof adapter.getBoard !== "function" || typeof adapter.setBoard !== "function")
      throw new Error("Missing board adapter");
    const opts = config || {};
    let inventory = createInventory(opts.inventory || { hammer: 2, bomb: 1, lightning: 1, rotate: 2 });
    let combo = 0;
    const getLevel = () => Number(typeof adapter.getLevel === "function" ? adapter.getLevel() : opts.level || 1);
    return {
      getInventory: () => inventoryCopy(inventory),
      getCombo: () => combo,
      add: (booster, count) => {
        if (!POWERUPS.includes(booster)) return false;
        inventory[booster] += Math.max(0, Math.trunc(Number(count) || 0));
        return true;
      },
      use: (booster, position) => {
        if (!POWERUPS.includes(booster) || !inventory[booster]) return { ok:false, reason:"out-of-stock" };
        const attempt = preview(adapter.getBoard(), booster, position, {
          level: getLevel(),
          canCommit: typeof adapter.canCommit === "function" ? adapter.canCommit.bind(adapter) : null
        });
        if (!attempt.ok) return attempt;
        adapter.setBoard(attempt.board);
        inventory[booster]--;
        if (typeof adapter.onPowerup === "function") adapter.onPowerup(attempt);
        return attempt;
      },
      recordMove: (success) => {
        if (getLevel() < LEVEL_START) return { combo: 0, rewarded: null };
        combo = success ? combo + 1 : 0;
        if (combo && combo % 5 === 0) {
          // Predictable reward rotation; no random advantage or payment dependency.
          const booster = ["hammer", "rotate", "bomb", "lightning"][(combo / 5 - 1) % 4];
          inventory[booster]++;
          return { combo, rewarded: booster };
        }
        return { combo, rewarded: null };
      },
      resetCombo: () => { combo = 0; },
      restoreInventory: saved => { inventory = createInventory(saved); }
    };
  }

  return Object.freeze({ LEVEL_START, POWERUPS, difficultyFor, preview, createController, createInventory });
});
