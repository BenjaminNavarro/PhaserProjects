
function Spline(game, spriteSheet, bmd, flags) {
  this.points = [];
  this.sprites = [];
  for(var p=0; p<4; ++p) {
    this.points[p] = new Phaser.Point();
  }
  
  this.game = game;
  this.spriteSheet = spriteSheet;
  this.bmd = bmd;
  this.flags = flags;
}

Spline.prototype = {
  constructor: Spline,
  create: function() {
    for (var p = 0; p < this.points.x.length; p++)
    {
        this.sprites[p] = this.game.add.sprite(this.points.x[p], this.points.y[p], this.spriteSheet, p);
        this.sprites[p].anchor.set(0.5);
        this.sprites[p].inputEnabled = true;
        this.sprites[p].input.enableDrag(true);
        this.sprites[p].events.onDragUpdate.add(function(){this.flags.updateNeeded = true;}, this);
    }
  },
  update: function() {
    var x = 1 / this.game.width;

    for (var i = 0; i < this.points.x.length; i++) {
       this.points.x[i] = this.sprites[i].x;
       this.points.y[i] = this.sprites[i].y;
    }

    for (var i = 0; i <= 1; i += x)
    {
        var px = this.game.math.bezierInterpolation(this.points.x, i);
        var py = this.game.math.bezierInterpolation(this.points.y, i);

        this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
    }
  }
};
