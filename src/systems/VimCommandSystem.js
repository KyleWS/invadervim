export default class VimCommandSystem {
  constructor(scene) {
    this.scene = scene;
    this.commandBuffer = '';
    this.isCommandMode = false;
    this.isVisualMode = false;
  }

  start() {
    // VimOverlay will be set by the scene after creation
    this.vimOverlay = null;
  }

  setVimOverlay(overlay) {
    this.vimOverlay = overlay;
  }

  handleInput(event) {
    // Handle word navigation when not in command mode
    if (!this.isCommandMode) {
      if (event.key === 'v' && this.scene.tutorialStage >= 3) {
        this.isVisualMode = !this.isVisualMode;
        if (this.vimOverlay) {
          if (this.isVisualMode) {
            this.vimOverlay.enterVisualMode();
            this.vimOverlay.showCommandEffect('visual-mode');
          } else {
            this.vimOverlay.exitVisualMode();
            this.vimOverlay.showCommandEffect('normal-mode');
          }
        }
        return true;
      } else if (event.key === 'd' && this.isVisualMode && this.scene.tutorialStage >= 3) {
        if (this.vimOverlay) {
          const deletedWord = this.vimOverlay.deleteSelection();
          if (deletedWord) {
            this.vimOverlay.showCommandEffect('delete: ' + deletedWord);
            this.scene.killRandomEnemies(2);
            this.vimOverlay.flash();
          }
          this.vimOverlay.exitVisualMode();
          this.isVisualMode = false;
        }
        return true;
      } else if (event.key === 'w' && this.scene.tutorialStage >= 2) {
        if (this.vimOverlay) {
          this.vimOverlay.moveCursorToNextWord();
          this.vimOverlay.showCommandEffect('word-forward');
        }
        this.scene.movePlayerRight();
        return true;
      } else if (event.key === 'b' && this.scene.tutorialStage >= 2) {
        if (this.vimOverlay) {
          this.vimOverlay.moveCursorToPreviousWord();
          this.vimOverlay.showCommandEffect('word-back');
        }
        this.scene.movePlayerLeft();
        return true;
      } else if (event.key === ':') {
        this.enterCommandMode();
        return true;
      }
      return false;
    }

    if (event.key === 'Enter') {
      this.executeCommand();
      return true;
    }

    if (event.key === 'Backspace') {
      this.commandBuffer = this.commandBuffer.slice(0, -1);
    } else if (event.key.length === 1) {
      this.commandBuffer += event.key;
    }

    this.updateCommandText();
    return true;
  }

  enterCommandMode() {
    this.isCommandMode = true;
    this.commandBuffer = '';
    this.updateCommandText();
  }

  exitCommandMode() {
    this.isCommandMode = false;
    this.commandBuffer = '';
    this.updateCommandText();
  }

  updateCommandText() {
    if (this.vimOverlay) {
      this.vimOverlay.updateCommandText(this.isCommandMode ? `:${this.commandBuffer}` : '');
    }
  }

  executeCommand() {
    const command = this.commandBuffer.trim();
    if (command === 'q') {
      // Always shoot and start game on first :q
      if (!this.scene.gameStarted) {
        this.scene.startRound();
        this.scene.playerShoot();
        if (this.vimOverlay) {
          this.vimOverlay.flash();
          this.vimOverlay.showCommandEffect('game-start');
        }
      } else if (this.scene.roundPaused) {
        // Start/unpause subsequent rounds
        this.scene.startRound();
        if (this.vimOverlay) {
          this.vimOverlay.flash();
          this.vimOverlay.showCommandEffect('round-start');
        }
      } else {
        // Normal shot during gameplay
        this.scene.playerShoot();
        if (this.vimOverlay) {
          this.vimOverlay.flash();
          this.vimOverlay.showCommandEffect('shoot');
        }
      }
    } else if (command === 'q!' && this.scene.gameOver) {
      // Restart game
      this.scene.scene.restart();
    }
    this.exitCommandMode();
  }
}
