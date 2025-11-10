// Crossword puzzle engine (vanilla JS)
// Words provided by user are placed into a 15x15 grid.
// Each cell either contains a letter input or is a black cell.
// This version places each word in its own slot (some horizontal, some vertical)
// to guarantee placement and give a playable crossword-like puzzle.

(() => {
  const GRID_SIZE = 15;
  const gridEl = document.getElementById('grid');
  const acrossList = document.getElementById('acrossList');
  const downList = document.getElementById('downList');
  const message = document.getElementById('message');
  const checkBtn = document.getElementById('checkBtn');
  const revealBtn = document.getElementById('revealBtn');
  const solveBtn = document.getElementById('solveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const shareBtn = document.getElementById('shareBtn');
  const timerEl = document.getElementById('timer');

  // Timer state
  let timerInterval = null;
  let startTime = null;
  let elapsedBeforePause = 0; // ms

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  function updateTimerDisplay() {
    const elapsed = (startTime ? (Date.now() - startTime) : 0) + elapsedBeforePause;
    timerEl.textContent = `Time: ${formatTime(elapsed)}`;
    return elapsed;
  }

  function startTimer() {
    if (startTime) return; // already started
    startTime = Date.now();
    timerInterval = setInterval(updateTimerDisplay, 250);
    updateTimerDisplay();
  }

  function stopTimer() {
    if (!startTime) return;
    elapsedBeforePause += (Date.now() - startTime);
    startTime = null;
    clearInterval(timerInterval);
    timerInterval = null;
    updateTimerDisplay();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    elapsedBeforePause = 0;
    timerEl.textContent = 'Time: 00:00';
    if (shareBtn) shareBtn.style.display = 'none';
  }

  // Puzzle entries
  const ENTRIES = [
    { id: 11, word: "HEATHCLIFF", clue: "He is the Spiderman looking CM", row: 0, col: 0, dir: "across" },
    { id: 1, word: "SEISMIC", clue: "A privacy enabled blockchain for fintechs", row: 1, col: 1, dir: "across" },
    { id: 2, word: "MAGNITUDE", clue: "What is the KEY", row: 3, col: 1, dir: "across" },
    { id: 3, word: "BROOKWELL", clue: "First app building on SEISMIC", row: 5, col: 1, dir: "across" },
    { id: 4, word: "ANDREESSEN", clue: "The Lead investor", row: 7, col: 1, dir: "across" },
    { id: 5, word: "LYRON", clue: "CEO of SEISMIC", row: 9, col: 1, dir: "across" },
    { id: 6, word: "XEALIST", clue: "Always dressing Cooperate", row: 11, col: 1, dir: "across" },
    { id: 7, word: "NOXX", clue: "Always holding Rocky in his hand", row: 13, col: 1, dir: "across" },
    { id: 8, word: "RETH", clue: "The node on which the project runs on", row: 1, col: 11, dir: "down" },
    { id: 9, word: "OCTOBER", clue: "The month Seismic Reth was introduced", row: 1, col: 12, dir: "down" },
    { id: 10, word: "PRIVACY", clue: "The state of being private", row: 1, col: 13, dir: "down" }
  ];

  // Build an empty grid structure
  const cells = Array.from({length: GRID_SIZE}, () => Array.from({length: GRID_SIZE}, () => null));

  // Place entries: fill cells with objects {letter, entryId, index}
  ENTRIES.forEach(entry => {
    const w = entry.word.toUpperCase();
    for (let i = 0; i < w.length; i++) {
      const r = entry.row + (entry.dir === 'down' ? i : 0);
      const c = entry.col + (entry.dir === 'across' ? i : 0);
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        console.warn("Entry out of bounds:", entry);
        continue;
      }
      if (cells[r][c] && cells[r][c].letter !== w[i]) {
        console.warn("Conflict at", r, c, cells[r][c], w[i]);
      } else {
        cells[r][c] = { letter: w[i], entryId: entry.id, index: i };
      }
    }
  });

  // Remaining cells are black (null)
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!cells[r][c]) cells[r][c] = null;
    }
  }

  // Render grid
  function renderGrid() {
    gridEl.innerHTML = '';
    const numbering = {};
    let clueNum = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = cells[r][c];
        if (!cell) continue;
        const isStartAcross = ( (c === 0 || !cells[r][c-1]) && hasAcrossAt(r,c) );
        const isStartDown = ( (r === 0 || !cells[r-1][c]) && hasDownAt(r,c) );
        if (isStartAcross || isStartDown) numbering[`${r},${c}`] = clueNum++;
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = cells[r][c];
        const el = document.createElement('div');
        el.className = 'cell';
        el.dataset.r = r;
        el.dataset.c = c;
        if (!cell) {
          el.classList.add('black');
          gridEl.appendChild(el);
          continue;
        }
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.dataset.r = r;
        input.dataset.c = c;
        input.dataset.entry = cell.entryId;
        input.dataset.index = cell.index;
        input.value = '';
        el.appendChild(input);

        const key = `${r},${c}`;
        if (numbering[key]) {
          const num = document.createElement('div');
          num.className = 'num';
          num.textContent = numbering[key];
          el.appendChild(num);
          el.dataset.num = numbering[key];
        }

        gridEl.appendChild(el);
      }
    }
  }

  function hasAcrossAt(r, c) {
    const cell = cells[r][c];
    if (!cell) return false;
    const entry = ENTRIES.find(e => e.id === cell.entryId);
    return entry && entry.dir === 'across' && entry.word.length >= 1 && entry.col === c - cell.index;
  }
  function hasDownAt(r, c) {
    const cell = cells[r][c];
    if (!cell) return false;
    const entry = ENTRIES.find(e => e.id === cell.entryId);
    return entry && entry.dir === 'down' && entry.word.length >= 1 && entry.row === r - cell.index;
  }

  // Build clue lists
  function renderClues() {
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    const numbering = {};
    let clueNum = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = cells[r][c];
        if (!cell) continue;
        const isStartAcross = ( (c === 0 || !cells[r][c-1]) && hasAcrossAt(r,c) );
        const isStartDown = ( (r === 0 || !cells[r-1][c]) && hasDownAt(r,c) );
        if (isStartAcross || isStartDown) numbering[`${r},${c}`] = clueNum++;
      }
    }

    ENTRIES.forEach(entry => {
      const r = entry.row;
      const c = entry.col;
      const num = numbering[`${r},${c}`] || '?';
      const el = document.createElement('div');
      el.className = 'clue';
      el.dataset.entry = entry.id;
      el.tabIndex = 0;
      el.innerHTML = `<div><strong>${num}.</strong>&nbsp;<span style="margin-left:6px">${entry.word.length} letters</span></div><small>${entry.clue}</small>`;
      if (entry.dir === 'across') acrossList.appendChild(el);
      else downList.appendChild(el);
      el.addEventListener('click', () => focusEntry(entry.id));
      el.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') focusEntry(entry.id); });
    });
  }

  // Utilities to find input element by row,col
  function inputAt(r,c) {
    return gridEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
  }

  // Focus an entry
  let selectedEntryId = null;
  function focusEntry(entryId) {
    const entry = ENTRIES.find(e => e.id === Number(entryId));
    if (!entry) return;
    selectedEntryId = entry.id;
    highlightEntry(entry.id);
    const r = entry.row;
    const c = entry.col;
    const inp = inputAt(r,c);
    if (inp) {
      inp.focus();
      inp.select?.();
      message.textContent = `Selected ${entry.dir.toUpperCase()} ${entry.word.length}-letter word`;
      startTimer();
    }
  }

  function highlightEntry(entryId) {
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('highlight'));
    const entry = ENTRIES.find(e => e.id === Number(entryId));
    if (!entry) return;
    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.row + (entry.dir === 'down' ? i : 0);
      const c = entry.col + (entry.dir === 'across' ? i : 0);
      const el = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (el) el.classList.add('highlight');
    }
  }

  // Input handling
  function handleInputEvent(e) {
    const t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    startTimer();
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);

    let ch = t.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (ch.length > 1) ch = ch.slice(-1);
    t.value = ch;

    if (ch) {
      const entryId = Number(t.dataset.entry);
      const entry = ENTRIES.find(e => e.id === entryId);
      if (entry) {
        const nextIndex = Number(t.dataset.index) + 1;
        if (nextIndex < entry.word.length) {
          const nr = entry.row + (entry.dir === 'down' ? nextIndex : 0);
          const nc = entry.col + (entry.dir === 'across' ? nextIndex : 0);
          const next = inputAt(nr,nc);
          if (next) next.focus();
        }
      } else {
        const next = inputAt(r, c+1);
        if (next) next.focus();
      }
    }
    clearCellState(r,c);
  }

  function clearCellState(r,c) {
    const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (!cellEl) return;
    cellEl.classList.remove('incorrect','correct');
  }

  // Keyboard navigation and backspace
  function handleKeyDown(e) {
    const t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    const entryId = Number(t.dataset.entry);
    const entry = ENTRIES.find(e => e.id === entryId);

    const moveFocus = (nr, nc) => {
      const next = inputAt(nr,nc);
      if (next) next.focus();
    };

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveFocus(r, c-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveFocus(r, c+1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(r-1, c);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(r+1, c);
    } else if (e.key === 'Backspace') {
      if (!t.value) {
        e.preventDefault();
        if (entry) {
          const prevIndex = Number(t.dataset.index) - 1;
          if (prevIndex >= 0) {
            const pr = entry.row + (entry.dir === 'down' ? prevIndex : 0);
            const pc = entry.col + (entry.dir === 'across' ? prevIndex : 0);
            const prev = inputAt(pr,pc);
            if (prev) {
              prev.focus();
              prev.value = '';
            }
          }
        } else {
          const prev = inputAt(r, c-1);
          if (prev) {
            prev.focus();
            prev.value = '';
          }
        }
      }
    }
  }

  // Check a word
  function checkEntry(entryId) {
    const entry = ENTRIES.find(e => e.id === Number(entryId));
    if (!entry) return false;
    let ok = true;
    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.row + (entry.dir === 'down' ? i : 0);
      const c = entry.col + (entry.dir === 'across' ? i : 0);
      const inp = inputAt(r,c);
      const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      const expected = entry.word[i].toUpperCase();
      const given = (inp && inp.value) ? inp.value.toUpperCase() : '';
      if (given === expected) {
        cellEl.classList.add('correct');
        cellEl.classList.remove('incorrect');
      } else {
        cellEl.classList.add('incorrect');
        cellEl.classList.remove('correct');
        ok = false;
      }
    }
    return ok;
  }

  // Check all entries and handle results (sharing/capture removed)
  async function checkAll() {
    if (!startTime && elapsedBeforePause === 0) startTimer();
    stopTimer();

    let all = true;
    let correctCount = 0;
    ENTRIES.forEach(en => {
      const ok = checkEntry(en.id);
      if (!ok) all = false;
      if (ok) correctCount++;
    });

    const total = ENTRIES.length;
    const elapsedMs = elapsedBeforePause;
    const timeText = formatTime(elapsedMs);
    message.textContent = `${correctCount}/${total} correct — Time: ${timeText}`;

    // Sharing & screenshotting removed: only allow share UI when fully correct is no longer relevant.
    if (shareBtn) {
      shareBtn.style.display = 'none';
      shareBtn.onclick = null;
    }

    if (all) {
      message.textContent = `All correct! Well done — Time: ${timeText}`;
      // Previously we would prepare and share or download an annotated image here.
      // That behavior has been removed per request.
    }
  }

  // Reveal and solve helpers
  function revealSelected() {
    if (!selectedEntryId) {
      message.textContent = 'Select a word first (click a clue or a cell).';
      return;
    }
    const entry = ENTRIES.find(e => e.id === selectedEntryId);
    revealEntry(entry.id);
  }
  function revealEntry(entryId) {
    const entry = ENTRIES.find(e => e.id === Number(entryId));
    if (!entry) return;
    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.row + (entry.dir === 'down' ? i : 0);
      const c = entry.col + (entry.dir === 'across' ? i : 0);
      const inp = inputAt(r,c);
      if (inp) {
        inp.value = entry.word[i];
        const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        cellEl.classList.add('correct');
        cellEl.classList.remove('incorrect');
      }
    }
    message.textContent = `Revealed: ${entry.word}`;
  }

  function solveAll() {
    ENTRIES.forEach(en => revealEntry(en.id));
    message.textContent = 'Puzzle solved.';
  }

  function resetAll() {
    document.querySelectorAll('#grid input').forEach(inp => {
      inp.value = '';
      const r = Number(inp.dataset.r), c = Number(inp.dataset.c);
      const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (cellEl) cellEl.classList.remove('correct','incorrect');
    });
    resetTimer();
    message.textContent = 'Grid cleared.';
  }

  // Click on cell focuses and highlights its entry
  function handleGridClick(e) {
    const cellDiv = e.target.closest('.cell');
    if (!cellDiv || cellDiv.classList.contains('black')) return;
    const r = Number(cellDiv.dataset.r);
    const c = Number(cellDiv.dataset.c);
    const inp = inputAt(r,c);
    if (inp) {
      inp.focus();
      const entryId = Number(inp.dataset.entry);
      selectedEntryId = entryId;
      highlightEntry(entryId);
      const entry = ENTRIES.find(en => en.id === entryId);
      message.textContent = `${entry.dir.toUpperCase()} ${entry.word.length}-letter word selected.`;
    }
  }

  // Initialization
  function init() {
    renderGrid();
    renderClues();

    gridEl.addEventListener('input', handleInputEvent);
    gridEl.addEventListener('keydown', handleKeyDown);
    gridEl.addEventListener('click', handleGridClick);

    checkBtn.addEventListener('click', () => { checkAll(); });
    revealBtn.addEventListener('click', () => { revealSelected(); });
    solveBtn.addEventListener('click', () => {
      if (confirm('Reveal all answers?')) solveAll();
    });
    resetBtn.addEventListener('click', () => {
      if (confirm('Clear the grid?')) resetAll();
    });

    // make clue clicks focus first letter
    document.querySelectorAll('.clue').forEach(c => {
      c.addEventListener('click', () => {
        const id = c.dataset.entry;
        focusEntry(id);
      });
    });

    // Hide share button (no screenshot/share functionality)
    if (shareBtn) shareBtn.style.display = 'none';

    message.textContent = 'Select a cell or a clue to begin.';
  }

  // Run
  init();

})();