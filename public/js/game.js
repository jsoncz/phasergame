
var config = {
  type: Phaser.WEBGL,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};


var game = new Phaser.Game(config);

function addPlayer(self, playerInfo) {
  self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player');
  self.player.anims.play('player', true);
  self.player.body.setCollideWorldBounds(true);
  self.player.body.setGravityY(300)
  

}


function addOtherPlayers(self, playerInfo) {
  otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer');
  otherPlayer.anims.play('otherPlayer', true);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
  otherPlayer.body.setCollideWorldBounds(true);
  otherPlayer.body.setGravityY(300)
 
}

function preload() {
   this.load.atlas('flares', 'assets/flares.png', 'assets/flares.json');
       this.load.image('spark', 'assets/blue.png');
  this.load.spritesheet('player', 'assets/player.png', {frameWidth:20,frameHeight:20});
  this.load.spritesheet('otherPlayer', 'assets/player2.png', {frameWidth:20,frameHeight:20});
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('ice', 'assets/iceplatform.png');
 ;

}
 
function create() {
  this.add.image(0, 0, 'sky').setOrigin(0, 0)
 
  //platforms
  platforms = this.physics.add.staticGroup();

  platforms.create(300, 568, 'ground').setScale(0.2).refreshBody();
  platforms.create(300, 488, 'ground').setScale(0.2).refreshBody();
  platforms.create(100, 488, 'ground').setScale(0.2).refreshBody();
  platforms.create(300, 288, 'ice').setScale(0.2).refreshBody();
  platforms.getChildren()[3].setFrictionX = 0.1 ;

  this.anims.create({
      key: 'player',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
  });
  this.anims.create({
      key: 'otherPlayer',
      frames: this.anims.generateFrameNumbers('otherPlayer', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
  });

  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
    this.socket.on('disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    cursors = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.otherPlayers, platforms);
   

  }



function update() {

  if (this.player) {
    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.player, this.otherPlayers);
      this.physics.add.collider(this.player, this.player);
    // emit player movement
    var x = this.player.x;
    var y = this.player.y;
    var r = this.player.rotation;
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || r !== this.player.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    }
  
    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
      rotation: this.player.rotation
    };
    if (cursors.left.isDown){
      this.player.setVelocityX(-160);
  }
  else if (cursors.right.isDown){
      this.player.setVelocityX(160);
  }
  else{
      this.player.setVelocityX(0);
  }
  if (cursors.up.isDown && this.player.body.blocked.down || cursors.up.isDown && this.player.body.touching.down){
      this.player.setVelocityY(-150);
      }
  }
}
