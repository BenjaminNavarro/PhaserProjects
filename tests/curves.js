var game;

function preload() {
    game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
}

function create() {
    this.flags = {updateNeeded: false};
    
    this.stage.backgroundColor = '#204090';

    this.bmd = this.add.bitmapData(this.game.width, this.game.height);
    this.bmd.addToWorld();

    this.spline = new Spline(game, 'balls', this.bmd, this.flags);
    this.spline.points = {
            'x': [ 100,  200, 350, 500 ],
            'y': [ 300, 500, 100, 300 ]
        };
    this.spline.create();
    this.spline.update();


    this.spline2 = new Spline(game, 'balls', this.bmd, this.flags);
    this.spline2.points = {
            'x': [ 600,  700, 500, 600 ],
            'y': [ 400, 300, 200, 100 ]
        };
    this.spline2.create();
    this.spline2.update();
}

function update() {
  if(this.flags.updateNeeded) {
    this.flags.updateNeeded = false;
    this.bmd.clear();
    this.spline.update();
    this.spline2.update();
  }
}

game = new Phaser.Game(800, 600, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
});
