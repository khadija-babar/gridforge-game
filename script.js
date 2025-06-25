/**
 * GridForge - War of Rock, Paper, Scissors
 * A survival game where players navigate a grid world, collect resources,
 * and battle enemies using Rock-Paper-Scissors mechanics.
 */

// Game state management using a class
class GridForgeGame {
  constructor() {
    // Initialize game state
    this.state = {
      gridSize: 10,
      player: {
        x: 5,
        y: 5,
        health: 100,
        moves: 0,
        isDay: true
      },
      inventory: {
        wood: { current: 1, max: 5 },
        metal: { current: 1, max: 5 },
        rock: { current: 1, max: 5 },
        medicine: { current: 1, max: 1 }
      },
      door: { x: 0, y: 0 },
      grid: [],
      isMoving: false,
      gameActive: true,
      currentRpsBattle: null,
      eventLog: []
    };

    // DOM elements cache
    this.elements = {
      gameGrid: document.getElementById('gameGrid'),
      healthValue: document.getElementById('healthValue'),
      healthBar: document.getElementById('healthBar'),
      moveCount: document.getElementById('moveCount'),
      woodCount: document.getElementById('woodCount'),
      metalCount: document.getElementById('metalCount'),
      rockCount: document.getElementById('rockCount'),
      medicineCount: document.getElementById('medicineCount'),
      timeIndicator: document.getElementById('timeIndicator'),
      moveBtn: document.getElementById('moveBtn'),
      medicineBtn: document.getElementById('medicineBtn'),
      restartBtn: document.getElementById('restartBtn'),
      eventLog: document.getElementById('eventLog'),
      introModal: document.getElementById('introModal'),
      startGameBtn: document.getElementById('startGameBtn'),
      rpsModal: document.getElementById('rpsModal'),
      rpsOptions: document.getElementById('rpsOptions'),
      rpsResult: document.getElementById('rpsResult'),
      rpsContinueBtn: document.getElementById('rpsContinueBtn'),
      gameOverModal: document.getElementById('gameOverModal'),
      gameOverTitle: document.getElementById('gameOverTitle'),
      gameOverMessage: document.getElementById('gameOverMessage'),
      gameOverBtn: document.getElementById('gameOverBtn')
    };

    // Terrain types enum
    this.Terrain = {
      MOUNTAIN: 'mountain',
      PLAIN: 'plain',
      WATER: 'water',
      FOREST: 'forest',
      HUMAN: 'human',
      DOOR: 'door',
      ENEMY: 'enemy',
      BUILDING: 'building'
    };

    // Initialize game
    this.initGame();
  }

  /**
   * Initialize the game
   */
  initGame() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Generate initial game grid
    this.generateGrid();
    
    // Render initial game state
    this.renderGrid();
    this.updateUI();
    
    // Show intro modal
    this.showModal(this.elements.introModal);
    
    // Add initial log entries
    this.addLogEntry("Game initialized. Prepare for your journey!");
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Button event listeners
    this.elements.startGameBtn.addEventListener('click', () => this.startGame());
    this.elements.moveBtn.addEventListener('click', () => this.toggleMovement());
    this.elements.medicineBtn.addEventListener('click', () => this.useMedicine());
    this.elements.restartBtn.addEventListener('click', () => this.resetGame());
    this.elements.rpsContinueBtn.addEventListener('click', () => this.handleRpsContinue());
    this.elements.gameOverBtn.addEventListener('click', () => this.resetGame());
    
    // Keyboard movement controls
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    
    // Cell click events (for mobile/touch support)
    this.elements.gameGrid.addEventListener('click', (e) => {
      if (!this.state.isMoving || !e.target.classList.contains('cell')) return;
      
      const cellIndex = Array.from(this.elements.gameGrid.children).indexOf(e.target);
      const x = Math.floor(cellIndex / this.state.gridSize);
      const y = cellIndex % this.state.gridSize;
      
      this.movePlayer(x, y);
    });
  }

  /**
   * Start the game (called from intro modal)
   */
  startGame() {
    this.hideModal(this.elements.introModal);
    this.addLogEntry("Game started! Find the red door to win.", 'highlight');
    this.addLogEntry("Collect resources to fight enemies and survive.");
  }

  /**
   * Generate the game grid with terrain, player, door, enemies, and buildings
   */
  generateGrid() {
    // Initialize empty grid
    this.state.grid = Array(this.state.gridSize).fill().map(() => 
      Array(this.state.gridSize).fill(null)
    );
    
    // Place door randomly on edges
    this.placeDoor();
    
    // Fill grid with terrain
    this.generateTerrain();
    
    // Place enemies
    this.placeEnemies();
    
    // Place buildings
    this.placeBuildings();
  }

  /**
   * Place the door randomly on one of the grid edges
   */
  placeDoor() {
    const edge = Math.floor(Math.random() * 4);
    switch(edge) {
      case 0: // Top edge
        this.state.door = { 
          x: 0, 
          y: Math.floor(Math.random() * this.state.gridSize) 
        };
        break;
      case 1: // Right edge
        this.state.door = { 
          x: Math.floor(Math.random() * this.state.gridSize), 
          y: this.state.gridSize - 1 
        };
        break;
      case 2: // Bottom edge
        this.state.door = { 
          x: this.state.gridSize - 1, 
          y: Math.floor(Math.random() * this.state.gridSize) 
        };
        break;
      case 3: // Left edge
        this.state.door = { 
          x: Math.floor(Math.random() * this.state.gridSize), 
          y: 0 
        };
        break;
    }
    
    // Ensure door isn't placed where player starts
    if (this.state.door.x === this.state.player.x && this.state.door.y === this.state.player.y) {
      this.placeDoor(); // Recursively try again
    }
  }

  /**
   * Generate terrain for the grid
   */
  generateTerrain() {
    const terrainTypes = [
      this.Terrain.MOUNTAIN, 
      this.Terrain.PLAIN, 
      this.Terrain.WATER, 
      this.Terrain.FOREST
    ];
    
    for (let i = 0; i < this.state.gridSize; i++) {
      for (let j = 0; j < this.state.gridSize; j++) {
        // Set player position
        if (i === this.state.player.x && j === this.state.player.y) {
          this.state.grid[i][j] = this.Terrain.HUMAN;
        } 
        // Set door position
        else if (i === this.state.door.x && j === this.state.door.y) {
          this.state.grid[i][j] = this.Terrain.DOOR;
        } 
        // Set random terrain
        else {
          this.state.grid[i][j] = terrainTypes[
            Math.floor(Math.random() * terrainTypes.length)
          ];
        }
      }
    }
  }

  /**
   * Place enemies randomly on the grid
   */
  placeEnemies() {
    const numEnemies = Math.floor((this.state.gridSize * this.state.gridSize) / 10);
    
    for (let i = 0; i < numEnemies; i++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        x = Math.floor(Math.random() * this.state.gridSize);
        y = Math.floor(Math.random() * this.state.gridSize);
        attempts++;
        
        // Prevent infinite loops
        if (attempts >= maxAttempts) {
          console.warn("Couldn't place all enemies after maximum attempts");
          return;
        }
      } while (
        // Don't place on player, door, or non-plain terrain
        (x === this.state.player.x && y === this.state.player.y) ||
        (x === this.state.door.x && y === this.state.door.y) ||
        this.state.grid[x][y] !== this.Terrain.PLAIN
      );
      
      this.state.grid[x][y] = this.Terrain.ENEMY;
    }
  }

  /**
   * Place buildings randomly on the grid
   */
  placeBuildings() {
    const numBuildings = Math.floor((this.state.gridSize * this.state.gridSize) / 20);
    
    for (let i = 0; i < numBuildings; i++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        x = Math.floor(Math.random() * this.state.gridSize);
        y = Math.floor(Math.random() * this.state.gridSize);
        attempts++;
        
        if (attempts >= maxAttempts) {
          console.warn("Couldn't place all buildings after maximum attempts");
          return;
        }
      } while (
        (x === this.state.player.x && y === this.state.player.y) ||
        (x === this.state.door.x && y === this.state.door.y) ||
        this.state.grid[x][y] !== this.Terrain.PLAIN
      );
      
      this.state.grid[x][y] = this.Terrain.BUILDING;
    }
  }

  /**
   * Render the game grid
   */
  renderGrid() {
    this.elements.gameGrid.innerHTML = '';
    
    // Create grid cells
    for (let i = 0; i < this.state.gridSize; i++) {
      for (let j = 0; j < this.state.gridSize; j++) {
        const terrain = this.state.grid[i][j];
        const cell = document.createElement('div');
        
        // Base cell classes
        cell.className = `cell ${terrain}`;
        
        // Set cell content based on terrain type
        switch(terrain) {
          case this.Terrain.MOUNTAIN: cell.textContent = 'M'; break;
          case this.Terrain.PLAIN: cell.textContent = 'P'; break;
          case this.Terrain.WATER: cell.textContent = 'W'; break;
          case this.Terrain.FOREST: cell.textContent = 'F'; break;
          case this.Terrain.HUMAN: cell.textContent = 'H'; break;
          case this.Terrain.DOOR: cell.textContent = 'D'; break;
          case this.Terrain.ENEMY: cell.textContent = 'E'; break;
          case this.Terrain.BUILDING: cell.textContent = 'B'; break;
        }
        
        // Hide terrain at night (except player)
        if (!this.state.player.isDay && terrain !== this.Terrain.HUMAN) {
          cell.style.backgroundColor = '#121212';
          cell.style.color = '#121212';
        }
        
        // Add data attributes for position
        cell.dataset.x = i;
        cell.dataset.y = j;
        
        this.elements.gameGrid.appendChild(cell);
      }
    }
  }

  /**
   * Update all UI elements based on current game state
   */
  updateUI() {
    // Update health display
    this.elements.healthValue.textContent = this.state.player.health;
    this.elements.healthBar.style.width = `${this.state.player.health}%`;
    
    // Update health bar color based on health level
    if (this.state.player.health <= 30) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #e53935, #ff1744)';
    } else if (this.state.player.health <= 60) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
    } else {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    }
    
    // Update inventory counts
    this.elements.woodCount.textContent = 
      `${this.state.inventory.wood.current}/${this.state.inventory.wood.max}`;
    this.elements.metalCount.textContent = 
      `${this.state.inventory.metal.current}/${this.state.inventory.metal.max}`;
    this.elements.rockCount.textContent = 
      `${this.state.inventory.rock.current}/${this.state.inventory.rock.max}`;
    this.elements.medicineCount.textContent = 
      `${this.state.inventory.medicine.current}/${this.state.inventory.medicine.max}`;
    
    // Update move count and time indicator
    this.elements.moveCount.textContent = this.state.player.moves;
    this.elements.timeIndicator.textContent = this.state.player.isDay ? 'DAYTIME' : 'NIGHTTIME';
    this.elements.timeIndicator.className = 
      `time-indicator ${this.state.player.isDay ? 'day' : 'night'}`;
    
    // Update medicine button state
    this.elements.medicineBtn.disabled = 
      this.state.player.health > 30 || 
      this.state.inventory.medicine.current === 0;
    
    // Update move button text
    this.elements.moveBtn.textContent = 
      this.state.isMoving ? 'Cancel Movement' : 'Move (W/A/S/D)';
  }

  /**
   * Toggle movement mode
   */
  toggleMovement() {
    this.state.isMoving = !this.state.isMoving;
    
    if (this.state.isMoving) {
      this.addLogEntry("Movement mode activated. Use W/A/S/D to move or click cells.", 'highlight');
    } else {
      this.addLogEntry("Movement mode canceled.");
    }
    
    this.updateUI();
  }

  /**
   * Handle keyboard movement
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyPress(e) {
    if (!this.state.isMoving || !this.state.gameActive) return;
    
    // Calculate new position based on key press
    let newX = this.state.player.x;
    let newY = this.state.player.y;
    let moved = false;
    
    switch(e.key.toLowerCase()) {
      case 'w': // Up
        if (newX > 0) {
          newX--;
          moved = true;
        }
        break;
      case 'a': // Left
        if (newY > 0) {
          newY--;
          moved = true;
        }
        break;
      case 's': // Down
        if (newX < this.state.gridSize - 1) {
          newX++;
          moved = true;
        }
        break;
      case 'd': // Right
        if (newY < this.state.gridSize - 1) {
          newY++;
          moved = true;
        }
        break;
      default:
        return; // Ignore other keys
    }
    
    if (moved) {
      this.movePlayer(newX, newY);
    } else {
      this.addLogEntry("Can't move further in that direction!", 'danger');
    }
  }

  /**
   * Move player to new position and handle terrain effects
   * @param {number} newX - New X coordinate
   * @param {number} newY - New Y coordinate
   */
  movePlayer(newX, newY) {
    // Don't move if position didn't change
    if (newX === this.state.player.x && newY === this.state.player.y) {
      return;
    }
    
    const terrain = this.state.grid[newX][newY];
    const terrainEffects = {
      [this.Terrain.MOUNTAIN]: () => {
        this.state.player.health -= 10;
        this.addLogEntry("You moved through a mountain! Health -10.", 'danger');
      },
      [this.Terrain.FOREST]: () => {
        this.state.player.health -= 5;
        this.addLogEntry("You moved through a forest! Health -5.", 'danger');
      },
      [this.Terrain.PLAIN]: () => {
        this.state.player.health -= 5;
        this.addLogEntry("You moved through a plain! Health -5.", 'danger');
      },
      [this.Terrain.WATER]: () => {
        if (this.state.inventory.wood.current > 0) {
          if (confirm("Water ahead! Make boat with 1 Wood?")) {
            this.state.inventory.wood.current--;
            this.addLogEntry("Boat made with 1 Wood. Moved across water.", 'highlight');
          } else {
            this.addLogEntry("Move canceled.");
            return false; // Cancel move
          }
        } else {
          this.addLogEntry("Not enough wood for a boat. Move canceled.", 'danger');
          return false; // Cancel move
        }
      },
      [this.Terrain.BUILDING]: () => {
        if (this.state.inventory.metal.current < this.state.inventory.metal.max) {
          if (confirm("Search building for metal?")) {
            this.state.inventory.metal.current++;
            this.addLogEntry("Found metal in the building!", 'success');
          }
        } else {
          this.addLogEntry("Building has no metal or your inventory is full.");
        }
      },
      [this.Terrain.ENEMY]: () => {
        this.startRpsBattle(newX, newY);
        return false; // Don't complete move until battle resolved
      },
      [this.Terrain.DOOR]: () => {
        this.winGame();
        return false; // Game ends
      }
    };
    
    // Apply terrain effect if it exists
    const effect = terrainEffects[terrain];
    if (effect) {
      const shouldContinue = effect();
      if (shouldContinue === false) {
        return; // Don't complete the move
      }
    }
    
    // Update player position
    this.state.grid[this.state.player.x][this.state.player.y] = this.Terrain.PLAIN;
    this.state.player.x = newX;
    this.state.player.y = newY;
    this.state.grid[newX][newY] = this.Terrain.HUMAN;
    
    // Update move count and day/night cycle
    this.state.player.moves++;
    if (this.state.player.moves % 5 === 0) {
      this.state.player.isDay = !this.state.player.isDay;
      this.addLogEntry(
        this.state.player.isDay ? 
          "The sun rises! It's now daytime." : 
          "The sun sets! It's now nighttime.", 
        'highlight'
      );
    }
    
    // Check for death
    if (this.state.player.health <= 0) {
      this.gameOver("You have died. Game over.");
      return;
    }
    
    // Handle resource collection
    if (terrain === this.Terrain.FOREST && 
        this.state.inventory.wood.current < this.state.inventory.wood.max) {
      if (confirm("Collect wood here?")) {
        this.state.inventory.wood.current++;
        this.addLogEntry("Wood collected successfully!", 'success');
      }
    } else if (terrain === this.Terrain.MOUNTAIN && 
               this.state.inventory.rock.current < this.state.inventory.rock.max) {
      if (confirm("Collect rock here?")) {
        this.state.inventory.rock.current++;
        this.addLogEntry("Rock collected successfully!", 'success');
      }
    }
    
    // Update UI and grid
    this.updateUI();
    this.renderGrid();
    
    // Auto-disable movement mode after move
    this.state.isMoving = false;
    this.updateUI();
  }

  /**
   * Start Rock-Paper-Scissors battle with enemy
   * @param {number} x - X coordinate of enemy
   * @param {number} y - Y coordinate of enemy
   */
  startRpsBattle(x, y) {
    // Store battle position
    this.state.currentRpsBattle = { x, y };
    
    // Check available options
    const hasRock = this.state.inventory.rock.current > 0;
    const hasPaper = this.state.inventory.wood.current >= 2;
    const hasScissors = this.state.inventory.metal.current > 0;
    
    if (!hasRock && !hasPaper && !hasScissors) {
      this.gameOver("You don't have any resources to fight the enemy!");
      return;
    }
    
    // Prepare RPS options UI
    this.elements.rpsOptions.innerHTML = '';
    
    const options = [
      { choice: 'rock', enabled: hasRock, cost: '1 Rock' },
      { choice: 'paper', enabled: hasPaper, cost: '2 Wood' },
      { choice: 'scissors', enabled: hasScissors, cost: '1 Metal' }
    ];
    
    options.forEach(option => {
      if (!option.enabled) return;
      
      const optionElement = document.createElement('div');
      optionElement.className = 'rps-option';
      optionElement.textContent = `${option.choice.charAt(0).toUpperCase() + option.choice.slice(1)} (${option.cost})`;
      optionElement.dataset.choice = option.choice;
      optionElement.addEventListener('click', () => this.playRps(option.choice));
      
      this.elements.rpsOptions.appendChild(optionElement);
    });
    
    // Show RPS modal
    this.elements.rpsResult.innerHTML = '';
    this.elements.rpsContinueBtn.style.display = 'none';
    this.showModal(this.elements.rpsModal);
  }

  /**
   * Play Rock-Paper-Scissors
   * @param {string} playerChoice - Player's choice ('rock', 'paper', or 'scissors')
   */
  playRps(playerChoice) {
    // Deduct resources
    switch(playerChoice) {
      case 'rock':
        this.state.inventory.rock.current--;
        break;
      case 'paper':
        this.state.inventory.wood.current -= 2;
        break;
      case 'scissors':
        this.state.inventory.metal.current--;
        break;
    }
    
    // Enemy makes random choice
    const choices = ['rock', 'paper', 'scissors'];
    const enemyChoice = choices[Math.floor(Math.random() * choices.length)];
    
    // Determine winner
    let result, resultClass;
    if (playerChoice === enemyChoice) {
      result = "It's a tie! You get another chance.";
      resultClass = 'highlight';
    } else if (
      (playerChoice === 'rock' && enemyChoice === 'scissors') ||
      (playerChoice === 'paper' && enemyChoice === 'rock') ||
      (playerChoice === 'scissors' && enemyChoice === 'paper')
    ) {
      result = "You win the RPS battle! Enemy defeated.";
      resultClass = 'success';
      
      // Convert enemy cell to plain
      const { x, y } = this.state.currentRpsBattle;
      this.state.grid[x][y] = this.Terrain.PLAIN;
    } else {
      result = "You lose the RPS battle! Health -25.";
      resultClass = 'danger';
      this.state.player.health -= 25;
    }
    
    // Display result
    this.elements.rpsResult.innerHTML = `
      <p>You chose: <strong>${playerChoice}</strong></p>
      <p>Enemy chose: <strong>${enemyChoice}</strong></p>
      <p class="${resultClass}">${result}</p>
    `;
    
    // Show continue button
    this.elements.rpsContinueBtn.style.display = 'block';
    
    // Set continue button action based on result
    if (result.includes('lose')) {
      if (this.state.player.health <= 0) {
        this.elements.rpsContinueBtn.textContent = 'Continue';
        this.elements.rpsContinueBtn.onclick = () => {
          this.hideModal(this.elements.rpsModal);
          this.gameOver("You have died. Game over.");
        };
      } else if (this.state.player.health <= 30 && 
                 this.state.inventory.medicine.current > 0) {
        this.elements.rpsContinueBtn.textContent = 'Use Medicine';
        this.elements.rpsContinueBtn.onclick = () => {
          this.hideModal(this.elements.rpsModal);
          this.useMedicine();
        };
      } else {
        this.elements.rpsContinueBtn.textContent = 'Continue';
        this.elements.rpsContinueBtn.onclick = () => {
          this.hideModal(this.elements.rpsModal);
          this.updateUI();
          this.renderGrid();
        };
      }
    } else {
      this.elements.rpsContinueBtn.textContent = 'Continue';
      this.elements.rpsContinueBtn.onclick = () => {
        this.hideModal(this.elements.rpsModal);
        this.updateUI();
        this.renderGrid();
      };
    }
    
    // Disable options after choice
    const options = this.elements.rpsOptions.querySelectorAll('.rps-option');
    options.forEach(option => {
      option.classList.add('disabled');
      option.style.pointerEvents = 'none';
    });
    
    // Update UI
    this.updateUI();
    
    // Add to log
    this.addLogEntry(
      `RPS Battle: You (${playerChoice}) vs Enemy (${enemyChoice}) - ${result}`,
      resultClass
    );
  }

  /**
   * Handle RPS continue button click
   */
  handleRpsContinue() {
    this.hideModal(this.elements.rpsModal);
    
    // Check for death
    if (this.state.player.health <= 0) {
      this.gameOver("You have died. Game over.");
      return;
    }
    
    // Update grid and UI
    this.updateUI();
    this.renderGrid();
  }

  /**
   * Use medicine to restore health
   */
  useMedicine() {
    if (this.state.player.health > 30) {
      this.addLogEntry("You can only use medicine when health is 30 or below!", 'danger');
      return;
    }
    
    if (this.state.inventory.medicine.current === 0) {
      this.addLogEntry("You don't have any medicine!", 'danger');
      return;
    }
    
    // Use medicine
    this.state.inventory.medicine.current--;
    this.state.player.health = Math.min(this.state.player.health + 40, 100);
    
    // Add resources
    this.state.inventory.wood.current = Math.min(
      this.state.inventory.wood.current + 1, 
      this.state.inventory.wood.max
    );
    this.state.inventory.metal.current = Math.min(
      this.state.inventory.metal.current + 1, 
      this.state.inventory.metal.max
    );
    this.state.inventory.rock.current = Math.min(
      this.state.inventory.rock.current + 1, 
      this.state.inventory.rock.max
    );
    
    this.addLogEntry(
      "Medicine used! Health +40, and received 1 wood, 1 metal, and 1 rock.", 
      'success'
    );
    
    // Update UI
    this.updateUI();
    this.renderGrid();
  }

  /**
   * Add entry to event log
   * @param {string} message - Log message
   * @param {string} [className] - CSS class for styling
   */
  addLogEntry(message, className = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${className}`;
    entry.textContent = message;
    
    // Add timestamp
    const now = new Date();
    const timestamp = document.createElement('span');
    timestamp.className = 'log-timestamp';
    timestamp.textContent = ` [${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    entry.appendChild(timestamp);
    
    this.elements.eventLog.appendChild(entry);
    
    // Auto-scroll to bottom
    this.elements.eventLog.scrollTop = this.elements.eventLog.scrollHeight;
    
    // Add to state for persistence
    this.state.eventLog.push({
      message,
      className,
      timestamp: now.toISOString()
    });
  }

  /**
   * Show modal dialog
   * @param {HTMLElement} modal - Modal element to show
   */
  showModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal dialog
   * @param {HTMLElement} modal - Modal element to hide
   */
  hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Win the game
   */
  winGame() {
    this.state.gameActive = false;
    this.elements.gameOverTitle.textContent = "You Win!";
    this.elements.gameOverMessage.textContent = 
      "Congratulations! You reached the door and escaped!";
    this.showModal(this.elements.gameOverModal);
    this.addLogEntry("You reached the door! You win!", 'success');
  }

  /**
   * Game over
   * @param {string} message - Game over message
   */
  gameOver(message) {
    this.state.gameActive = false;
    this.state.isMoving = false;
    
    this.elements.gameOverTitle.textContent = "Game Over";
    this.elements.gameOverMessage.textContent = message;
    this.showModal(this.elements.gameOverModal);
    this.addLogEntry(message, 'danger');
    
    // Update UI
    this.updateUI();
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    // Close all modals
    this.hideModal(this.elements.introModal);
    this.hideModal(this.elements.rpsModal);
    this.hideModal(this.elements.gameOverModal);
    
    // Reset game state
    this.state = {
      gridSize: 10,
      player: {
        x: 5,
        y: 5,
        health: 100,
        moves: 0,
        isDay: true
      },
      inventory: {
        wood: { current: 1, max: 5 },
        metal: { current: 1, max: 5 },
        rock: { current: 1, max: 5 },
        medicine: { current: 1, max: 1 }
      },
      door: { x: 0, y: 0 },
      grid: [],
      isMoving: false,
      gameActive: true,
      currentRpsBattle: null,
      eventLog: []
    };
    
    // Clear event log UI
    this.elements.eventLog.innerHTML = '';
    
    // Regenerate grid
    this.generateGrid();
    this.renderGrid();
    this.updateUI();
    
    // Show intro
    this.showModal(this.elements.introModal);
  }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new GridForgeGame();
  
  // Make game available in console for debugging
  window.game = game;
});