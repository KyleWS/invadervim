export default class VimOverlay {
  constructor(scene) {
    this.scene = scene;
    this.cursorPos = { line: 0, col: 0 };
    this.visualStart = null;
    this.cursorBlinkTimer = null;
    this.cursorVisible = true;
    this.tutorialStage = 1;
    this.highlightGraphics = null;
    this.isVisualMode = false;
    this.content = this.getTutorialContent();
    this.setup();
    this.startCursorBlink();
  }

  startCursorBlink() {
    this.cursorBlinkTimer = this.scene.time.addEvent({
      delay: 530,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.updateCursor();
      },
      loop: true
    });
  }

  setup() {
    const width = 400;
    const height = 350;
    const x = this.scene.game.config.width / 2;
    const y = this.scene.game.config.height / 2;

    // Create window background
    const graphics = this.scene.add.graphics();
    graphics.setDepth(1);
    
    // Draw window background
    graphics.fillStyle(0x262626, 0.4);
    graphics.fillRect(x - width/2, y - height/2, width, height);
    
    // Draw window border
    graphics.lineStyle(2, 0x444444, 0.4);
    graphics.strokeRect(x - width/2, y - height/2, width, height);

    // Add content text
    this.contentTexts = [];
    const startY = y - height/2 + 20;
    
    this.content.forEach((line, index) => {
      const text = this.scene.add.text(x - width/2 + 10, startY + index * 20, line, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fill: '#a8a8a8'
      });
      text.setDepth(2);
      this.contentTexts.push(text);
    });

    // Create cursor
    this.cursor = this.scene.add.text(0, 0, '\u2588', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fill: '#a8a8a8'
    });
    this.cursor.setDepth(3);
    this.updateCursor();

    // Create command line area
    this.commandArea = this.scene.add.graphics();
    this.commandArea.setDepth(1);
    this.commandArea.fillStyle(0x262626, 0.4);
    this.commandArea.fillRect(x - width/2, y + height/2 - 25, width, 25);

    // Add command text
    this.commandText = this.scene.add.text(x - width/2 + 10, y + height/2 - 20, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fill: '#a8a8a8'
    });
    this.commandText.setDepth(2);

    // Store window bounds
    this.windowBounds = {
      x: x - width/2,
      y: y - height/2,
      width,
      height
    };
  }

  enterVisualMode() {
    this.isVisualMode = true;
    this.visualStart = {...this.cursorPos};
    this.updateVisualHighlight();
  }

  exitVisualMode() {
    // Clear any highlight texts
    if (this.highlightTexts) {
      this.highlightTexts.forEach(text => text.destroy());
      this.highlightTexts = [];
    }
    this.isVisualMode = false;
    this.visualStart = null;
    if (this.highlightGraphics) {
      this.highlightGraphics.clear();
    }
  }

  getWordAtPosition(pos) {
    const line = this.content[pos.line];
    if (!line) return null;

    let start = pos.col;
    let end = pos.col;

    // Find start of word
    while (start > 0 && line[start - 1] !== ' ') {
      start--;
    }

    // Find end of word
    while (end < line.length && line[end] !== ' ') {
      end++;
    }

    return {
      word: line.substring(start, end),
      start,
      end,
      line: pos.line
    };
  }

  getWordAtCursor() {
    return this.getWordAtPosition(this.cursorPos);
    const line = this.content[this.cursorPos.line];
    if (!line) return null;

    let start = this.cursorPos.col;
    let end = this.cursorPos.col;

    // Find start of word
    while (start > 0 && line[start - 1] !== ' ') {
      start--;
    }

    // Find end of word
    while (end < line.length && line[end] !== ' ') {
      end++;
    }

    return {
      word: line.substring(start, end),
      start,
      end,
      line: this.cursorPos.line
    };
  }

  showGameOverPrompt() {
    this.updateCommandText('Want to play again? quit without saving ":q!"');
  }

  deleteSelection() {
    if (!this.isVisualMode || !this.visualStart) return null;

    const range = this.getTextRange();
    if (!range) return null;

    // Get the line content
    const line = this.content[range.line];
    if (!line) return null;

    // Create new line content with selection removed
    const newLine = line.substring(0, range.start) + ' '.repeat(range.end - range.start) + line.substring(range.end);
    this.content[range.line] = newLine;

    // Update the display
    this.contentTexts[range.line].setText(newLine);

    // Return the deleted text
    return range.text;
  }

  getTextRange() {
    if (!this.isVisualMode || !this.visualStart) return null;

    const currentPos = this.cursorPos;
    if (currentPos.line !== this.visualStart.line) return null;

    // Get the full line content
    const line = this.content[currentPos.line];
    if (!line) return null;

    // Determine the range to highlight
    const start = Math.min(this.visualStart.col, currentPos.col);
    const end = Math.max(this.visualStart.col, currentPos.col);

    return {
      text: line.substring(start, end),
      start,
      end,
      line: currentPos.line
    };
  }

  updateVisualHighlight() {
    // Clear previous highlights
    if (this.highlightTexts) {
      this.highlightTexts.forEach(text => text.destroy());
      this.highlightTexts = [];
    }
    if (!this.isVisualMode || !this.visualStart) return;

    if (!this.highlightGraphics) {
      this.highlightGraphics = this.scene.add.graphics();
      this.highlightGraphics.setDepth(2);
    }

    this.highlightGraphics.clear();

    const range = this.getTextRange();
    if (!range) return;

    const baseText = this.contentTexts[range.line];
    const charWidth = 8;
    const charHeight = 16;

    // Create inverted color effect for the entire selection
    const highlightText = this.scene.add.text(
      baseText.x + (range.start * charWidth),
      baseText.y,
      range.text,
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        fill: '#262626',
        backgroundColor: '#a8a8a8'
      }
    );
    highlightText.setDepth(2.5);

    // Store the highlight text for cleanup
    if (!this.highlightTexts) this.highlightTexts = [];
    this.highlightTexts.push(highlightText);

    // Add subtle background highlight
    this.highlightGraphics.fillStyle(0x444444, 0.2);
    this.highlightGraphics.fillRect(
      baseText.x + (range.start * charWidth),
      baseText.y,
      (range.end - range.start) * charWidth,
      charHeight
    );
  }

  updateCursor() {
    if (!this.cursor || !this.contentTexts[this.cursorPos.line]) return;

    const baseText = this.contentTexts[this.cursorPos.line];
    const charWidth = 8;
    
    this.cursor.x = baseText.x + (this.cursorPos.col * charWidth);
    this.cursor.y = baseText.y;
    this.cursor.alpha = this.cursorVisible ? 1 : 0;

    if (this.isVisualMode) {
      this.updateVisualHighlight();
    }
  }

  getTutorialContent() {
    switch(this.tutorialStage) {
      case 1:
        return [
          'Dear Vim Warrior,',
          '',
          'Your first mission:',
          'Master the art of shooting!',
          '',
          'Command to learn:',
          ':q - To shoot your laser:',
          '1. Press Shift + ; for :',
          '2. Then press q',
          '3. Submit with Enter',
          '',
          'Good luck, commander!',
          '~',
          '~'
        ];
      case 2:
        return [
          'Excellent shooting, warrior!',
          '',
          'New movement techniques unlocked:',
          '',
          'w - Move forward by word',
          'b - Move backward by word',
          '',
          'Use these to dodge enemy fire!',
          '~',
          '~'
        ];
      case 3:
        return [
          'You\'re becoming a Vim master!',
          '',
          'Advanced technique unlocked:',
          '',
          'v - Enter visual mode',
          'd - Delete selection',
          '',
          'Combine these for special attacks!',
          '~',
          '~'
        ];
      default:
        return this.content;
    }
  }

  updateTutorialStage(stage) {
    if (this.tutorialStage !== stage) {
      this.tutorialStage = stage;
      const newContent = this.getTutorialContent();
      this.content = newContent;
      
      // Update all text objects
      this.contentTexts.forEach((text, index) => {
        text.setText(newContent[index] || '~');
      });

      // Reset cursor position
      this.cursorPos = { line: 0, col: 0 };
      this.updateCursor();
    }
  }

  moveCursorToNextWord() {
    let line = this.cursorPos.line;
    let col = this.cursorPos.col;

    while (line < this.content.length) {
      const lineContent = this.content[line];
      let found = false;

      // If at the end of line, move to next line's first word
      if (col >= lineContent.length) {
        line++;
        col = 0;
        if (line < this.content.length) {
          const nextLine = this.content[line];
          // Find first non-space character
          while (col < nextLine.length && nextLine[col] === ' ') {
            col++;
          }
          if (col < nextLine.length) {
            found = true;
          }
        }
      } else {
        // Skip current word if we're in the middle of one
        while (col < lineContent.length && lineContent[col] !== ' ') {
          col++;
        }
        // Skip spaces
        while (col < lineContent.length && lineContent[col] === ' ') {
          col++;
        }
        if (col < lineContent.length) {
          found = true;
        }
      }

      if (found) break;

      line++;
      col = 0;

      if (line >= this.content.length) {
        line = 0;
      }
    }

    this.cursorPos.line = line;
    this.cursorPos.col = col;
    this.updateCursor();
  }

  moveCursorToPreviousWord() {
    let line = this.cursorPos.line;
    let col = this.cursorPos.col;

    while (line >= 0) {
      const lineContent = this.content[line];
      let found = false;

      // If we're in the middle of a word or at its start, go to the previous word
      if (col > 0) {
        // Move to end of previous word
        while (col > 0 && lineContent[col - 1] === ' ') {
          col--;
        }
        // Find start of word
        while (col > 0 && lineContent[col - 1] !== ' ') {
          col--;
        }
        if (col >= 0) {
          found = true;
        }
      }

      if (found) break;

      line--;
      
      if (line < 0) {
        line = this.content.length - 1;
      }
      col = this.content[line] ? this.content[line].length - 1 : 0;
    }

    this.cursorPos.line = line;
    this.cursorPos.col = col;
    this.updateCursor();
  }

  updateCommandText(text) {
    this.commandText.setText(text);
  }

  flash() {
    const flash = this.scene.add.graphics();
    flash.setDepth(10);
    flash.fillStyle(0xffffff, 0.5);
    flash.fillRect(
      this.windowBounds.x,
      this.windowBounds.y,
      this.windowBounds.width,
      this.windowBounds.height
    );

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy()
    });
  }

  showCommandEffect(command) {
    const text = this.scene.add.text(
      this.windowBounds.x + this.windowBounds.width / 2,
      this.windowBounds.y + this.windowBounds.height / 2,
      `[${command}]`,
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        fill: '#00ff00'
      }
    );
    text.setOrigin(0.5);
    text.setDepth(15);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }
}
