import { ASCII } from '../config/ascii';
import VimCommandSystem from '../systems/VimCommandSystem';
import VimOverlay from '../ui/VimOverlay';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.score = 0;
    this.gameOver = false;
    this.gameTime = 0;
    this.enemySpeedMultiplier = 1;
    this.enemiesKilled = 0;
    this.tutorialStage = 1;
    this.gameStarted = false;
    this.roundPaused = true;
    this.currentRound = 1;
  }

  create() {
    // Start game timer
    this.time.addEvent({
      delay: 1000,  // 1 second
      callback: () => {
        if (!this.gameOver) {
          this.gameTime++;
          // Increase enemy speed every 30 seconds, up to 1.5x original speed
          this.enemySpeedMultiplier = Math.min(1.5, 1 + (this.gameTime / 30) * 0.25);
        }
      },
      loop: true
    });

    // Create Vim overlay
    this.vimOverlay = new VimOverlay(this);

    // Setup command system
    this.vimCommand = new VimCommandSystem(this);
    this.vimCommand.start();
    this.vimCommand.setVimOverlay(this.vimOverlay);

    // Create player
    this.player = this.add.text(400, 550, ASCII.player, {
      fontFamily: 'monospace',
      fontSize: '20px',
      fill: '#fff'
    }).setOrigin(0.5);

    // Create enemies
    this.createEnemies();

    // Setup score display
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff'
    });

    // Input handling
    this.input.keyboard.on('keydown', (event) => {
      if (!this.vimCommand.handleInput(event)) {
        this.handlePlayerMovement(event);
      }
    });

    // Add game title
    this.add.text(400, 50, 'Vim Invaders', {
      fontSize: '32px',
      fill: '#fff'
    }).setOrigin(0.5);

    // Add instructions
    this.add.text(400, 100, 'Press : then q to shoot!', {
      fontSize: '16px',
      fill: '#fff'
    }).setOrigin(0.5);
  }

  createEnemies() {
    const rows = 3;
    const enemiesPerRow = 6;
    const startX = 200;
    const startY = 150;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < enemiesPerRow; col++) {
        const enemy = this.add.text(
          startX + col * 100,
          startY + row * 50,
          ASCII.enemy,
          {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ff0000'
          }
        ).setOrigin(0.5);
        
        this.enemies.push({
          sprite: enemy,
          direction: 1,
          moveCounter: 0
        });
      }
    }
  }

  handlePlayerMovement(event) {
    if (this.gameOver) return;

    const moveSpeed = 10;
    if (event.key === 'ArrowLeft' || event.key === 'h') {
      this.movePlayerLeft();
    } else if (event.key === 'ArrowRight' || event.key === 'l') {
      this.movePlayerRight();
    }
  }

  movePlayerLeft() {
    if (this.gameOver) return;
    const wordJumpSize = 50; // Larger movement for word navigation
    this.player.x = Math.max(50, this.player.x - wordJumpSize);
  }

  movePlayerRight() {
    if (this.gameOver) return;
    const wordJumpSize = 50; // Larger movement for word navigation
    this.player.x = Math.min(750, this.player.x + wordJumpSize);
  }

  killRandomEnemies(count) {
    if (this.gameOver || this.enemies.length === 0) return;

    // Get random enemies
    const enemyIndices = [];
    const maxKills = Math.min(count, this.enemies.length);
    
    while (enemyIndices.length < maxKills) {
      const randomIndex = Math.floor(Math.random() * this.enemies.length);
      if (!enemyIndices.includes(randomIndex)) {
        enemyIndices.push(randomIndex);
      }
    }

    // Sort in descending order to avoid index shifting when removing enemies
    enemyIndices.sort((a, b) => b - a);

    // Kill each selected enemy
    enemyIndices.forEach(index => {
      const enemy = this.enemies[index];
      
      // Show explosion
      this.add.text(enemy.sprite.x, enemy.sprite.y, ASCII.explosion, {
        fontFamily: 'monospace',
        fontSize: '20px',
        fill: '#ff0000'
      }).setOrigin(0.5);

      // Remove enemy
      enemy.sprite.destroy();
      this.enemies.splice(index, 1);

      // Update score
      this.score += 20;
      this.enemiesKilled++;
    });

    this.scoreText.setText('Score: ' + this.score);

    // Check for tutorial progression
    if (this.enemiesKilled === 2 && this.tutorialStage === 1) {
      this.tutorialStage = 2;
      this.vimOverlay.updateTutorialStage(2);
    } else if (this.enemiesKilled === 5 && this.tutorialStage === 2) {
      this.tutorialStage = 3;
      this.vimOverlay.updateTutorialStage(3);
    }
  }

  playerSpecialAttack() {
    if (this.gameOver) return;

    // Create a wave effect that damages all enemies in a row
    const y = this.player.y - 20;
    const wave = this.add.text(
      this.player.x,
      y,
      '~~~~',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        fill: '#ff0000'
      }
    ).setOrigin(0.5);

    // Animate the wave
    this.tweens.add({
      targets: wave,
      scaleX: 10,
      alpha: 0,
      duration: 1000,
      onComplete: () => wave.destroy()
    });

    // Check for enemies in the wave's path
    const waveY = y;
    this.enemies.forEach((enemy, index) => {
      if (Math.abs(enemy.sprite.y - waveY) < 30) {
        // Show explosion
        this.add.text(enemy.sprite.x, enemy.sprite.y, ASCII.explosion, {
          fontFamily: 'monospace',
          fontSize: '20px',
          fill: '#ff0000'
        }).setOrigin(0.5);

        // Remove enemy
        enemy.sprite.destroy();
        this.enemies.splice(index, 1);

        // Update score
        this.score += 20;
        this.enemiesKilled++;
        this.scoreText.setText('Score: ' + this.score);

        // Check for tutorial progression
        if (this.enemiesKilled === 2 && this.tutorialStage === 1) {
          this.tutorialStage = 2;
          this.vimOverlay.updateTutorialStage(2);
        } else if (this.enemiesKilled === 5 && this.tutorialStage === 2) {
          this.tutorialStage = 3;
          this.vimOverlay.updateTutorialStage(3);
        }
      }
    });
  }

  startRound() {
    if (this.roundStartText) {
      this.roundStartText.destroy();
      this.roundStartText = null;
    }
    this.roundPaused = false;
    if (!this.gameStarted) {
      this.gameStarted = true;
    }
  }

  pauseForNewRound() {
    this.roundPaused = true;
    this.currentRound++;
    
    // Show round start message
    const text = this.add.text(
      this.game.config.width / 2,
      this.game.config.height / 2 - 50,
      `Round ${this.currentRound}\n\nType :q to start`,
      {
        fontFamily: 'monospace',
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    text.setDepth(100);

    // Store the text to remove it when round starts
    this.roundStartText = text;
  }

  playerShoot() {
    if (this.gameOver) return;

    const bullet = this.add.text(
      this.player.x,
      this.player.y - 20,
      ASCII.bullet,
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        fill: '#fff'
      }
    ).setOrigin(0.5);

    this.bullets.push(bullet);
  }

  update() {
    if (this.gameOver) return;

    // Check if all enemies are destroyed
    if (this.gameStarted && !this.roundPaused && this.enemies.length === 0) {
      this.pauseForNewRound();
      return;
    }

    // Don't update game state if paused
    if (!this.gameStarted || this.roundPaused) {
      return;
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.y -= 5;

      // Check for collisions with enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (Math.abs(bullet.x - enemy.sprite.x) < 20 &&
            Math.abs(bullet.y - enemy.sprite.y) < 20) {
          
          // Show explosion
          this.add.text(enemy.sprite.x, enemy.sprite.y, ASCII.explosion, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ff0000'
          }).setOrigin(0.5);
          
          // Remove enemy and bullet
          enemy.sprite.destroy();
          this.enemies.splice(j, 1);
          bullet.destroy();
          this.bullets.splice(i, 1);
          
          // Update score
          this.score += 10;
          this.enemiesKilled++;
          this.scoreText.setText('Score: ' + this.score);
          
          // Check for tutorial progression
          if (this.enemiesKilled === 2 && this.tutorialStage === 1) {
            this.tutorialStage = 2;
            this.vimOverlay.updateTutorialStage(2);
          } else if (this.enemiesKilled === 5 && this.tutorialStage === 2) {
            this.tutorialStage = 3;
            this.vimOverlay.updateTutorialStage(3);
          }
          
          break;
        }
      }

      // Remove bullets that are off screen
      if (bullet.y < 0) {
        bullet.destroy();
        this.bullets.splice(i, 1);
      }
    }

    // Move enemies
    let shouldChangeDirection = false;
    for (const enemy of this.enemies) {
      enemy.moveCounter += 1;
      if (enemy.moveCounter >= Math.max(30, 80 / this.enemySpeedMultiplier)) { // Move more slowly, adjusted by speed multiplier
        enemy.sprite.x += 20 * enemy.direction;
        enemy.moveCounter = 0;

        if (enemy.sprite.x > 750 || enemy.sprite.x < 50) {
          shouldChangeDirection = true;
        }
      }
    }

    if (shouldChangeDirection) {
      for (const enemy of this.enemies) {
        enemy.direction *= -1;
        enemy.sprite.y += 20 * this.enemySpeedMultiplier;

        // Check for game over - enemies reached player
        if (enemy.sprite.y > this.player.y - 50) {
          this.gameOver = true;
          this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000'
          }).setOrigin(0.5);
          this.vimOverlay.showGameOverPrompt();
          break;
        }
      }
    }

    // Check for win condition
    if (this.enemies.length === 0) {
      this.gameOver = true;
      this.add.text(400, 300, 'YOU WIN!', {
        fontSize: '64px',
        fill: '#00ff00'
      }).setOrigin(0.5);
      this.vimOverlay.showGameOverPrompt();
    }
  }
}
