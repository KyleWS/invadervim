import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 650,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
