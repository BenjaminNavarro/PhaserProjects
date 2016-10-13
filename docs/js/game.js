var Flags = (function () {
    function Flags() {
        this.updateNeeded = true;
    }
    return Flags;
}());
var PointType;
(function (PointType) {
    PointType[PointType["Start"] = 0] = "Start";
    PointType[PointType["StartControl"] = 1] = "StartControl";
    PointType[PointType["EndControl"] = 2] = "EndControl";
})(PointType || (PointType = {}));
var MultiSpline = (function () {
    function MultiSpline(game, mask, spriteSheet, flags) {
        this.sprites = new Array();
        this.last_sprites_pos = new Array();
        this.game = game;
        this.mask = mask;
        this.spriteSheet = spriteSheet;
        this.flags = flags;
        this.flags.updateNeeded = false;
    }
    MultiSpline.prototype.create = function (points) {
        for (var p = 0; p < points.length; p++) {
            this.sprites.push(this.game.add.sprite(points[p].x, points[p].y, this.spriteSheet, p % 3));
            this.last_sprites_pos.push(new Phaser.Point(points[p].x, points[p].y));
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
        this.mask.clear();
        this.mask.beginFill(0xffffff);
        this.mask.moveTo(this.sprites[0].x, this.sprites[0].y);
        for (var k = 0; k < this.sprites.length - 3; k += 3) {
            this.mask.bezierCurveTo(this.sprites[k + 1].x, this.sprites[k + 1].y, this.sprites[k + 2].x, this.sprites[k + 2].y, this.sprites[k + 3].x, this.sprites[k + 3].y);
        }
        this.mask.bezierCurveTo(this.sprites[this.sprites.length - 2].x, this.sprites[this.sprites.length - 2].y, this.sprites[this.sprites.length - 1].x, this.sprites[this.sprites.length - 1].y, this.sprites[0].x, this.sprites[0].y);
        this.mask.endFill();
    };
    MultiSpline.prototype.onDrag = function (sprite) {
        this.flags.updateNeeded = true;
        var pt = this.sprites.indexOf(sprite);
        var type = pt % 3;
        var dx;
        var dy;
        switch (type) {
            case PointType.Start:
                dx = this.sprites[pt].x - this.last_sprites_pos[pt].x;
                dy = this.sprites[pt].y - this.last_sprites_pos[pt].y;
                var prev_ctrl = this.getSpriteByIndex(pt - 1);
                var next_ctrl = this.getSpriteByIndex(pt + 1);
                prev_ctrl.x += dx;
                prev_ctrl.y += dy;
                next_ctrl.x += dx;
                next_ctrl.y += dy;
                break;
            case PointType.StartControl:
                prev_ctrl = this.getSpriteByIndex(pt - 2);
                var prev_point = this.getSpriteByIndex(pt - 1);
                dx = this.sprites[pt].x - prev_point.x;
                dy = this.sprites[pt].y - prev_point.y;
                prev_ctrl.x = prev_point.x - dx;
                prev_ctrl.y = prev_point.y - dy;
                break;
            case PointType.EndControl:
                next_ctrl = this.getSpriteByIndex(pt + 2);
                var next_point = this.getSpriteByIndex(pt + 1);
                dx = this.sprites[pt].x - next_point.x;
                dy = this.sprites[pt].y - next_point.y;
                next_ctrl.x = next_point.x - dx;
                next_ctrl.y = next_point.y - dy;
                break;
        }
        for (var p = 0; p < this.sprites.length; p++) {
            this.last_sprites_pos[p].x = this.sprites[p].x;
            this.last_sprites_pos[p].y = this.sprites[p].y;
        }
    };
    MultiSpline.prototype.getSpriteByIndex = function (n) {
        if (n < 0) {
            return this.sprites[this.sprites.length + (n % -this.sprites.length)];
        }
        else {
            return this.sprites[n % this.sprites.length];
        }
    };
    return MultiSpline;
}());
var MultiSplineEditor = (function () {
    function MultiSplineEditor(game, bmd, mask, spriteSheet, flags) {
        this._game = game;
        this._bmd = bmd;
        this._mask = mask;
        this._spriteSheet = spriteSheet;
        this._flags = flags;
        this._lines = new Array();
        this._data = new Array();
    }
    MultiSplineEditor.prototype.start = function (onCompletion, context) {
        this._game.input.onDown.add(this.onPointerDown, this);
        this._game.input.addMoveCallback(this.pointerMoved, this);
        this._callback = onCompletion.bind(context);
    };
    MultiSplineEditor.prototype.onPointerDown = function (pointer) {
        if (this._tracing) {
            var x = this._currentLine.end.x;
            var y = this._currentLine.end.y;
            var clone = new Phaser.Line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y);
            this._lines.push(clone);
            this._bmd.line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y, '#00ff00');
            if (x === this._dropZone.x && y === this._dropZone.y) {
                var lines = this._lines.slice(0);
                this._data.push(lines);
                this._lines = new Array();
                this._currentLine = null;
                this._tracing = false;
                this.stop();
            }
            else {
                this._currentLine = new Phaser.Line(x, y, pointer.x, pointer.y);
            }
        }
        else {
            this._currentLine = new Phaser.Line(pointer.x, pointer.y, pointer.x, pointer.y);
            this._dropZone = new Phaser.Circle(pointer.x, pointer.y, 16);
            this._tracing = true;
        }
    };
    MultiSplineEditor.prototype.pointerMoved = function (pointer) {
        if (this._currentLine) {
            if (this._dropZone.contains(pointer.x, pointer.y) && this._lines.length > 1) {
                this._currentLine.end.setTo(this._dropZone.x, this._dropZone.y);
            }
            else {
                this._currentLine.end.setTo(pointer.x, pointer.y);
            }
        }
    };
    MultiSplineEditor.prototype.stop = function () {
        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);
        var path = this._data[this._data.length - 1];
        var spline = new MultiSpline(this._game, this._mask, this._spriteSheet, this._flags);
        var points = new Array();
        for (var i = 0; i < path.length; ++i) {
            points.push(path[i].start);
            var start_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.2);
            var end_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.8);
            points.push(start_ctrl);
            points.push(end_ctrl);
        }
        spline.create(points);
        spline.flags.updateNeeded = true;
        this._callback(spline);
    };
    MultiSplineEditor.prototype.render = function () {
        if (this._currentLine) {
            if (this._dropZone.contains(this._currentLine.end.x, this._currentLine.end.y)) {
                this._game.debug.geom(this._currentLine, '#ffff00');
            }
            else {
                this._game.debug.geom(this._currentLine, '#00ff00');
            }
        }
    };
    return MultiSplineEditor;
}());
var SimpleGame = (function () {
    function SimpleGame() {
        this.flags = new Flags();
        this.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'spline-content', {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render,
            splineCreated: this.splineCreated
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
        this.game.load.image('water', 'assets/BigWater.png');
        this.game.load.image('sand', 'assets/light_sand_template.jpg');
    };
    SimpleGame.prototype.create = function () {
        this.waterSprite = this.game.add.sprite(0, 0, 'water');
        this.flags = new Flags();
        this.flags.updateNeeded = true;
        this.islandMask = this.game.add.graphics(0, 0);
        this.islandMask.clear();
        this.sandSprite = this.game.add.sprite(0, 0, 'sand');
        this.sandSprite.mask = this.islandMask;
        this.bmd = this.game.make.bitmapData(this.game.width, this.game.height);
        this.bmd.addToWorld();
        this.multiSplineEditor = new MultiSplineEditor(this.game, this.bmd, this.islandMask, 'balls', this.flags);
        this.multiSplineEditor.start(this.splineCreated, this);
    };
    SimpleGame.prototype.update = function () {
        if (this.flags.updateNeeded) {
            this.flags.updateNeeded = false;
            if (this.multiSpline != undefined) {
                this.multiSpline.update();
            }
        }
    };
    SimpleGame.prototype.render = function () {
        this.multiSplineEditor.render();
    };
    SimpleGame.prototype.splineCreated = function (spline) {
        this.bmd.cls();
        this.multiSpline = spline;
        this.multiSpline.update();
    };
    return SimpleGame;
}());
window.onload = function () {
    var game = new SimpleGame();
};
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
