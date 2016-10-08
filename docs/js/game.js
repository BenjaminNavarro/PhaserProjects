var Flags = (function () {
    function Flags() {
    }
    return Flags;
}());
/// <reference path="Definitions.ts" />
var Spline = (function () {
    function Spline(game, spriteSheet, bmd, flags) {
        this.points = new Array(4);
        this.sprites = new Array(4);
        this.game = game;
        this.spriteSheet = spriteSheet;
        this.bmd = bmd;
        this.flags = flags;
        var pt = new Phaser.Point(0, 0);
        for (var p = 0; p < 4; ++p) {
            this.points[p] = pt;
        }
    }
    Spline.prototype.create = function () {
        for (var p = 0; p < this.points.length; p++) {
            this.sprites[p] = this.game.add.sprite(this.points[p].x, this.points[p].y, this.spriteSheet, p);
            this.sprites[p].anchor.set(0.5);
            this.sprites[p].inputEnabled = true;
            this.sprites[p].input.enableDrag(true);
            this.sprites[p].events.onDragUpdate.add(function () { this.flags.updateNeeded = true; }, this);
        }
    };
    Spline.prototype.update = function () {
        var x = 1 / this.game.width;
        var x_pts = new Array();
        var y_pts = new Array();
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].x = this.sprites[i].x;
            this.points[i].y = this.sprites[i].y;
            x_pts.push(this.points[i].x);
            y_pts.push(this.points[i].y);
        }
        for (var i = 0; i <= 1; i += x) {
            var px = Phaser.Math.bezierInterpolation(x_pts, i);
            var py = Phaser.Math.bezierInterpolation(y_pts, i);
            this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
        }
    };
    return Spline;
}());
/// <reference path="Definitions.ts" />
var PointType;
(function (PointType) {
    PointType[PointType["Start"] = 0] = "Start";
    PointType[PointType["StartControl"] = 1] = "StartControl";
    PointType[PointType["EndControl"] = 2] = "EndControl";
})(PointType || (PointType = {}));
var MultiSpline = (function () {
    function MultiSpline(game, spriteSheet, bmd, flags) {
        this.points = new Array(7);
        this.sprites = new Array(7);
        this.game = game;
        this.spriteSheet = spriteSheet;
        this.bmd = bmd;
        this.flags = flags;
        var pt = new Phaser.Point(0, 0);
        for (var p = 0; p < this.points.length; ++p) {
            this.points[p] = pt;
        }
    }
    MultiSpline.prototype.create = function () {
        for (var p = 0; p < this.sprites.length; p++) {
            this.sprites[p] = this.game.add.sprite(this.points[p].x, this.points[p].y, this.spriteSheet, p % 3);
            this.sprites[p].anchor.set(0.5);
            this.sprites[p].inputEnabled = true;
            this.sprites[p].input.enableDrag(true);
            this.sprites[p].events.onDragUpdate.add(this.onDrag, this);
        }
        for (var p = 0; p < this.sprites.length; p++) {
            this.onDrag(this.sprites[p]);
        }
    };
    MultiSpline.prototype.update = function () {
        for (var k = 0; k < this.points.length - 3; k += 3) {
            var x = 1 / this.game.width;
            var x_pts = new Array();
            var y_pts = new Array();
            for (var i = k; i < k + 4; i++) {
                this.points[i].x = this.sprites[i].x;
                this.points[i].y = this.sprites[i].y;
                x_pts.push(this.points[i].x);
                y_pts.push(this.points[i].y);
            }
            for (var p = 0; p <= 1; p += x) {
                var px = Phaser.Math.bezierInterpolation(x_pts, p);
                var py = Phaser.Math.bezierInterpolation(y_pts, p);
                this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
            }
        }
    };
    MultiSpline.prototype.onDrag = function (sprite) {
        this.flags.updateNeeded = true;
        var pt = this.sprites.indexOf(sprite);
        var type = pt % 3;
        var dx;
        var dy;
        switch (type) {
            case PointType.Start:
                dx = this.sprites[pt].x - this.points[pt].x;
                dy = this.sprites[pt].y - this.points[pt].y;
                if (pt == 0) {
                    this.sprites[pt + 1].x += dx;
                    this.sprites[pt + 1].y += dy;
                }
                else if (pt == this.points.length - 1) {
                    this.sprites[pt - 1].x += dx;
                    this.sprites[pt - 1].y += dy;
                }
                else {
                    this.sprites[pt - 1].x += dx;
                    this.sprites[pt - 1].y += dy;
                    this.sprites[pt + 1].x += dx;
                    this.sprites[pt + 1].y += dy;
                }
                break;
            case PointType.StartControl:
                if (pt != 1) {
                    dx = this.sprites[pt].x - this.sprites[pt - 1].x;
                    dy = this.sprites[pt].y - this.sprites[pt - 1].y;
                    this.sprites[pt - 2].x = this.sprites[pt - 1].x - dx;
                    this.sprites[pt - 2].y = this.sprites[pt - 1].y - dy;
                }
                break;
            case PointType.EndControl:
                if (pt != this.points.length - 2) {
                    dx = this.sprites[pt].x - this.sprites[pt + 1].x;
                    dy = this.sprites[pt].y - this.sprites[pt + 1].y;
                    this.sprites[pt + 2].x = this.sprites[pt + 1].x - dx;
                    this.sprites[pt + 2].y = this.sprites[pt + 1].y - dy;
                }
                break;
        }
        for (var p = 0; p < this.sprites.length; p++) {
            this.points[p].x = this.sprites[p].x;
            this.points[p].y = this.sprites[p].y;
        }
    };
    return MultiSpline;
}());
/// <reference path="../../typescript/phaser.d.ts" />
/// <reference path="Spline.ts" />
/// <reference path="MultiSpline.ts" />
/// <reference path="Definitions.ts" />
var SimpleGame = (function () {
    function SimpleGame() {
        this.flags = new Flags();
        // create our phaser game
        // 800 - width
        // 600 - height
        // Phaser.AUTO - determine the renderer automatically (canvas, webgl)
        // 'content' - the name of the container to add our game to
        // { preload:this.preload, create:this.create} - functions to call for our states
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'spline-content', {
            preload: this.preload,
            create: this.create,
            update: this.update });
        // this.splines = new Array<Spline>();
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
    };
    SimpleGame.prototype.create = function () {
        this.flags = new Flags();
        this.flags.updateNeeded = true;
        this.game.stage.backgroundColor = '#204090';
        this.bmd = this.game.add.bitmapData(this.game.width, this.game.height);
        this.bmd.addToWorld();
        this.multiSpline = new MultiSpline(this.game, 'balls', this.bmd, this.flags);
        this.multiSpline.points = [
            new Phaser.Point(100, 300),
            new Phaser.Point(200, 400),
            new Phaser.Point(300, 200),
            new Phaser.Point(400, 300),
            new Phaser.Point(500, 200),
            new Phaser.Point(600, 400),
            new Phaser.Point(700, 300)];
        this.multiSpline.create();
        this.multiSpline.update();
        // this.spline = new Spline(this.game, 'balls', this.bmd, this.flags);
        // this.spline.points = [
        // 	new Phaser.Point(100,300),
        // 	new Phaser.Point(200,400),
        // 	new Phaser.Point(300,200),
        // 	new Phaser.Point(400,300)];
        // this.spline.create();
        // this.spline.update();
        // this.splines[1] = new Spline(this.game, 'balls', this.bmd, this.flags);
        // this.splines[1].points = [
        // 	new Phaser.Point(600,400),
        // 	new Phaser.Point(700,300),
        // 	new Phaser.Point(500,200),
        // 	new Phaser.Point(600,100)];
        // for(var p=0; p<this.splines.length; p++) {
        // 	this.splines[p].create();
        // 	this.splines[p].update();
        // }
    };
    SimpleGame.prototype.update = function () {
        if (this.flags.updateNeeded) {
            this.flags.updateNeeded = false;
            this.bmd.clear();
            this.multiSpline.update();
        }
    };
    return SimpleGame;
}());
// when the page has finished loading, create our game
window.onload = function () {
    var game = new SimpleGame();
};
