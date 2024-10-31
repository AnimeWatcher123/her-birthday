const gridContainer = document.getElementById("grid-container");
const foundWordsContainer = document.getElementById("found-words");
const wordsToFind = ['baby', 'bubblegum', 'love', 'cupcake', 'darling', 'cutie', 'mine', 'anu', 'meriwali', 'motu']; // Add words as needed
const gridSize = 12;
let gridData;
let isDragging = false;
let startCell = null;
let selectedCells = [];
let initialDirection = null;
let wordsPlaced = 0; // Track successfully placed words
let wordsLeftToFind; // Track words left to find

// Initialize the game by creating the grid and placing words
function initGame() {
  gridData = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  wordsPlaced = 0;
  wordsToFind.forEach(placeWordOnGrid);
  wordsLeftToFind = wordsPlaced; // Initialize words left to find
  renderGrid();
  updateWordsLeftDisplay(); // Display words left to find
}

// Place each word on the grid with retries for conflict resolution
function placeWordOnGrid(word) {
  const maxAttempts = 100;
  let placed = false;

  for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
    const direction = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
    const startRow = Math.floor(Math.random() * gridSize);
    const startCol = Math.floor(Math.random() * gridSize);

    if (canPlaceWord(word, startRow, startCol, direction)) {
      placeWord(word, startRow, startCol, direction);
      placed = true;
      wordsPlaced++; // Increment the placed words counter
    }
  }

  if (!placed) {
    console.warn(`Could not place the word: ${word}`);
  }
}

// Check if a word can fit without conflicts
function canPlaceWord(word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    let currentRow = row;
    let currentCol = col;

    if (direction === 0) currentCol += i; // Horizontal
    else if (direction === 1) currentRow += i; // Vertical
    else if (direction === 2) { currentRow += i; currentCol += i; } // Diagonal

    if (currentRow >= gridSize || currentCol >= gridSize) return false;

    if (gridData[currentRow][currentCol] && gridData[currentRow][currentCol] !== word[i]) {
      return false; // Conflict detected
    }
  }

  return true;
}

// Place a word in the grid without overwriting conflicting letters
function placeWord(word, row, col, direction) {
  word = word.toUpperCase()
  for (let i = 0; i < word.length; i++) {
    let currentRow = row;
    let currentCol = col;

    if (direction === 0) currentCol += i; // Horizontal
    else if (direction === 1) currentRow += i; // Vertical
    else if (direction === 2) { currentRow += i; currentCol += i; } // Diagonal

    if (!gridData[currentRow][currentCol]) {
      gridData[currentRow][currentCol] = word[i];
    }
  }
}

// Render the grid onto the webpage
function renderGrid() {
  gridContainer.innerHTML = ''; // Clear any existing grid items

  gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-item");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.textContent = gridData[row][col] || getRandomLetter(); // Fill empty cells with random letters
      gridContainer.appendChild(cell);
    }
  }
}

// Function to get a random letter
function getRandomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

// Update the display of words left to find
function updateWordsLeftDisplay() {
  foundWordsContainer.textContent = `Words Left to Find: ${wordsLeftToFind}`;
}

// Word selection handling
gridContainer.addEventListener('mousedown', startSelection);
gridContainer.addEventListener('touchstart', (event) => startSelection(event, true));
gridContainer.addEventListener('mousemove', continueSelection);
gridContainer.addEventListener('touchmove', (event) => continueSelection(event, true));
gridContainer.addEventListener('mouseup', endSelection);
gridContainer.addEventListener('touchend', endSelection);

function startSelection(event, isTouch = false) {
  const target = isTouch ? document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY) : event.target;

  if (target.classList.contains('grid-item')) {
    isDragging = true;
    startCell = target;
    selectedCells = [startCell];
    initialDirection = null;
    startCell.classList.add('highlight');
  }
}

function continueSelection(event, isTouch = false) {
  if (!isDragging) return;

  event.preventDefault();
  const target = isTouch ? document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY) : event.target;

  if (target && target.classList.contains('grid-item') && !selectedCells.includes(target)) {
    const lastCell = selectedCells[selectedCells.length - 1];

    if (selectedCells.length > 1 && selectedCells[selectedCells.length - 2] === target) {
      lastCell.classList.remove('highlight');
      selectedCells.pop();
    } else {
      const direction = getDirection(startCell, target);

      if (!initialDirection && direction) {
        initialDirection = direction;
      }

      if (direction && isValidDirection(initialDirection, direction)) {
        selectedCells.push(target);
        target.classList.add('highlight');
      }
    }
  }
}

function endSelection() {
  if (isDragging) {
    isDragging = false;
    const selectedWord = selectedCells.map(cell => cell.textContent).join('');
    console.log('Final Selected Letters:', selectedWord);

    if (wordsToFind.includes(selectedWord.toLowerCase())) {
      selectedCells.forEach(cell => cell.classList.add('found'));
      wordsLeftToFind--; // Decrement words left to find
      document.querySelector('iframe').contentWindow.revealLetter()
      createConfettiBurst()
      updateWordsLeftDisplay(); // Update the display
    }
    clearHighlights();
  }
}

// Utility functions for direction and clearing highlights
function getDirection(start, current) {
  const startRow = parseInt(start.dataset.row);
  const startCol = parseInt(start.dataset.col);
  const currentRow = parseInt(current.dataset.row);
  const currentCol = parseInt(current.dataset.col);

  const dRow = currentRow - startRow;
  const dCol = currentCol - startCol;

  if (dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol)) {
    return { dRow: Math.sign(dRow), dCol: Math.sign(dCol) };
  }
  return null;
}

function isValidDirection(initialDir, currentDir) {
  return currentDir.dRow === initialDir.dRow && currentDir.dCol === initialDir.dCol;
}

function clearHighlights() {
  selectedCells.forEach(cell => {
    if (!cell.classList.contains('found')) {
      cell.classList.remove('highlight');
    }
  });
  selectedCells = [];
}

// Initialize the game
initGame();
