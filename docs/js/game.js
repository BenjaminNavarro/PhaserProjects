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
    function MultiSpline(game, area, mask) {
        this.game = game;
        this.mask = mask;
        this.area = area;
    }
    MultiSpline.prototype.create = function (points) {
        this.points = points;
    };
    MultiSpline.prototype.createFromString = function (data) {
        var _a = JSON.parse(data), x = _a[0], y = _a[1];
        var points = new Array();
        for (var i = 0; i < x.length; ++i) {
            points.push(new Phaser.Point(x[i], y[i]));
        }
        this.create(points);
    };
    MultiSpline.prototype.update = function () {
        if (this.points != undefined) {
            this.mask.clear();
            this.mask.beginFill(0xffffff);
            this.mask.drawRect(-1, -1, 1, 1);
            this.mask.drawRect(-1, this.game.height, 1, 1);
            this.mask.drawRect(this.game.width, -1, 1, 1);
            this.mask.drawRect(this.game.width, this.game.height, 1, 1);
            this.mask.moveTo(this.points[0].x, this.points[0].y);
            for (var k = 0; k < this.points.length - 3; k += 3) {
                this.mask.bezierCurveTo(this.points[k + 1].x, this.points[k + 1].y, this.points[k + 2].x, this.points[k + 2].y, this.points[k + 3].x, this.points[k + 3].y);
            }
            this.mask.bezierCurveTo(this.points[this.points.length - 2].x, this.points[this.points.length - 2].y, this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, this.points[0].x, this.points[0].y);
            this.mask.endFill();
        }
    };
    MultiSpline.prototype.getDerivative = function (segment, t) {
        var tangent = new Phaser.Point();
        if (t < 0 || t > 1) {
            return tangent;
        }
        var start_idx = Math.floor(segment) * 3;
        if (start_idx > this.points.length - 1) {
            return tangent;
        }
        var p0 = this.points[start_idx];
        var p1 = this.points[start_idx + 1];
        var p2 = this.points[start_idx + 2];
        var p3 = this.points[(start_idx + 3) % this.points.length];
        tangent.x = -p0.x * 3 * Math.pow(1 - t, 2)
            + p1.x * (3 * Math.pow(1 - t, 2) - 6 * (1 - t) * t)
            + p2.x * (6 * (1 - t) * t - 3 * t * t)
            + p3.x * 3 * t * t;
        tangent.y = -p0.y * 3 * Math.pow(1 - t, 2)
            + p1.y * (3 * Math.pow(1 - t, 2) - 6 * (1 - t) * t)
            + p2.y * (6 * (1 - t) * t - 3 * t * t)
            + p3.y * 3 * t * t;
        return tangent;
    };
    MultiSpline.prototype.getContour = function (segment, t) {
        var contour = new Phaser.Point();
        if (t < 0 || t > 1) {
            return contour;
        }
        var start_idx = Math.floor(segment) * 3;
        if (start_idx > this.points.length - 1) {
            return contour;
        }
        var p0 = this.points[start_idx];
        var p1 = this.points[start_idx + 1];
        var p2 = this.points[start_idx + 2];
        var p3 = this.points[(start_idx + 3) % this.points.length];
        contour.x = Math.pow(1 - t, 3) * p0.x + 3 * t * Math.pow(1 - t, 2) * p1.x + 3 * Math.pow(t, 2) * (1 - t) * p2.x + Math.pow(t, 3) * p3.x;
        contour.y = Math.pow(1 - t, 3) * p0.y + 3 * t * Math.pow(1 - t, 2) * p1.y + 3 * Math.pow(t, 2) * (1 - t) * p2.y + Math.pow(t, 3) * p3.y;
        return contour;
    };
    MultiSpline.prototype.stringify = function () {
        var content;
        var x = new Array();
        var y = new Array();
        for (var i = 0; i < this.points.length; ++i) {
            x.push(this.points[i].x);
            y.push(this.points[i].y);
        }
        content = JSON.stringify([x, y]);
        return content;
    };
    return MultiSpline;
}());
var MultiSplineEditor = (function () {
    function MultiSplineEditor(game, area, mask, spriteSheet, flags) {
        this._game = game;
        this._area = area;
        this._spriteSheet = spriteSheet;
        this._flags = flags;
        this._lines = new Array();
        this._data = new Array();
        this._spline = new MultiSpline(game, area, mask);
        this._drawingArea = game.add.graphics(area.x, area.y);
        this._drawingArea.beginFill(0xffffff, 0);
        this._drawingArea.drawRect(0, 0, game.width - area.x, game.height - area.y);
        this._drawingArea.endFill();
    }
    MultiSplineEditor.prototype.start = function (onCompletion, context) {
        this._drawingArea.inputEnabled = true;
        this._drawingArea.events.onInputDown.add(this.onPointerDown, this);
        this._game.input.addMoveCallback(this.pointerMoved, this);
        this._callback = onCompletion.bind(context);
        this._drawingArea.lineStyle(1, 0x00ff00, 1.0);
    };
    MultiSplineEditor.prototype.onPointerDown = function (object_Clicked, pointer) {
        if (this._tracing) {
            var x = this._currentLine.end.x;
            var y = this._currentLine.end.y;
            console.log(x, y);
            var clone = new Phaser.Line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y);
            this._lines.push(clone);
            this._drawingArea.lineTo(x - this._drawingArea.left, y - this._drawingArea.top);
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
            this._drawingArea.moveTo(pointer.x - this._drawingArea.left, pointer.y - this._drawingArea.top);
            this._currentLine = new Phaser.Line(pointer.x, pointer.y, pointer.x, pointer.y);
            this._dropZone = new Phaser.Circle(pointer.x, pointer.y, 16);
            this._tracing = true;
        }
    };
    MultiSplineEditor.prototype.isPointInArea = function (point) {
        var _a = [point.x, point.y], x = _a[0], y = _a[1];
        return (x >= this._drawingArea.left && x <= this._drawingArea.right && y >= this._drawingArea.top && y <= this._drawingArea.bottom);
    };
    MultiSplineEditor.prototype.pointerMoved = function (pointer) {
        if (this.isPointInArea(pointer)) {
            if (this._currentLine) {
                if (this._dropZone.contains(pointer.x, pointer.y) && this._lines.length > 1) {
                    this._currentLine.end.setTo(this._dropZone.x, this._dropZone.y);
                }
                else {
                    this._currentLine.end.setTo(pointer.x, pointer.y);
                }
            }
        }
    };
    MultiSplineEditor.prototype.stop = function () {
        var _this = this;
        this._drawingArea.clear();
        this._drawingArea.beginFill(0xffffff, 0);
        this._drawingArea.drawRect(0, 0, this._game.width - this._area.x, this._game.height - this._area.y);
        this._drawingArea.endFill();
        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);
        if (this._sprites != undefined) {
            for (var p = 0; p < this._sprites.length; p++) {
                this._sprites[p].destroy();
            }
        }
        this._sprites = new Array();
        this._last_sprites_pos = new Array();
        var path = this._data[this._data.length - 1];
        var setupSprite = function (pt, idx) {
            _this._sprites.push(_this._game.add.sprite(pt.x, pt.y, _this._spriteSheet, idx % 3));
            _this._sprites[idx].anchor.set(0.5);
            _this._sprites[idx].inputEnabled = true;
            _this._sprites[idx].input.enableDrag(true);
            _this._sprites[idx].events.onDragUpdate.add(_this.onDrag, _this);
        };
        for (var i = 0; i < path.length; ++i) {
            var pt = path[i].start;
            var start_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.);
            var end_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 1.);
            this._last_sprites_pos = this._last_sprites_pos.concat([pt, start_ctrl, end_ctrl]);
            setupSprite(pt, 3 * i);
            setupSprite(start_ctrl, 3 * i + 1);
            setupSprite(end_ctrl, 3 * i + 2);
        }
        for (var p = 0; p < this._sprites.length; p++) {
            this.onDrag(this._sprites[p]);
        }
        this._spline.create(this._last_sprites_pos);
        this._callback(this._spline);
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
    MultiSplineEditor.prototype.update = function () {
        this._spline.update();
    };
    MultiSplineEditor.prototype.destroy = function () {
        this._drawingArea.inputEnabled = false;
        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);
        if (this._sprites != undefined) {
            for (var p = 0; p < this._sprites.length; p++) {
                this._sprites[p].destroy();
            }
        }
        this._drawingArea.clear();
        delete this._lines;
        delete this._data;
    };
    MultiSplineEditor.prototype.onDrag = function (sprite) {
        if (this.isPointInArea(sprite)) {
            this._flags.updateNeeded = true;
            var pt = this._sprites.indexOf(sprite);
            var type = pt % 3;
            var dx = void 0;
            var dy = void 0;
            switch (type) {
                case PointType.Start:
                    dx = this._sprites[pt].x - this._last_sprites_pos[pt].x;
                    dy = this._sprites[pt].y - this._last_sprites_pos[pt].y;
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
                    dx = this._sprites[pt].x - prev_point.x;
                    dy = this._sprites[pt].y - prev_point.y;
                    prev_ctrl.x = prev_point.x - dx;
                    prev_ctrl.y = prev_point.y - dy;
                    break;
                case PointType.EndControl:
                    next_ctrl = this.getSpriteByIndex(pt + 2);
                    var next_point = this.getSpriteByIndex(pt + 1);
                    dx = this._sprites[pt].x - next_point.x;
                    dy = this._sprites[pt].y - next_point.y;
                    next_ctrl.x = next_point.x - dx;
                    next_ctrl.y = next_point.y - dy;
                    break;
            }
            for (var p = 0; p < this._sprites.length; p++) {
                this._last_sprites_pos[p].x = this._sprites[p].x;
                this._last_sprites_pos[p].y = this._sprites[p].y;
            }
        }
    };
    MultiSplineEditor.prototype.getSpriteByIndex = function (n) {
        if (n < 0) {
            return this._sprites[this._sprites.length + (n % -this._sprites.length)];
        }
        else {
            return this._sprites[n % this._sprites.length];
        }
    };
    return MultiSplineEditor;
}());
var Island = (function () {
    function Island(game, area) {
        this.normals1 = new Array();
        this.normals2 = new Array();
        this.tangents = new Array();
        this.contours = new Array();
        this.errorPoints = new Array();
        this._game = game;
        this._area = area;
        this.checkRadius = 20;
    }
    Island.prototype.check = function () {
        var segment = 0;
        var subDiv = 10;
        var tex = this._area.mask.generateTexture();
        var img = this._game.make.image(0, 0, tex);
        var bd = this._game.make.bitmapData(this._game.width + 2, this._game.height + 2);
        bd.copy(img);
        bd.update();
        var count = 0;
        for (var i = 0; i < bd.pixels.length; ++i) {
            if (bd.pixels[i] != 0)
                ++count;
        }
        console.log('path:', this._area.points);
        console.log("count:", count);
        console.log("w:", img.width, ", h:", img.height);
        console.log("tex w:", tex.width, ", tex h:", tex.height);
        console.log("data length:", bd.data.length);
        console.log("pixels length:", bd.pixels.length);
        this.normals1 = new Array();
        this.normals2 = new Array();
        this.tangents = new Array();
        this.contours = new Array();
        this.errorPoints = new Array();
        var all_check_ok = true;
        for (segment = 0; segment < this._area.points.length / 3; ++segment) {
            console.log("Segment:", segment);
            for (var t = 0; t <= 1; t += 1 / subDiv) {
                var contour = this._area.getContour(segment, t);
                var tangent = this._area.getDerivative(segment, t);
                var normal1 = new Phaser.Point(tangent.x, tangent.y);
                var normal2 = new Phaser.Point(tangent.x, tangent.y);
                normal1.perp();
                normal1.setMagnitude(this.checkRadius);
                normal1.add(contour.x, contour.y);
                normal2.rperp();
                normal2.setMagnitude(this.checkRadius);
                normal2.add(contour.x, contour.y);
                this.normals1.push(normal1);
                this.normals2.push(normal2);
                this.tangents.push(tangent);
                this.contours.push(contour);
                if (true || t == 0 && segment == 0) {
                    var checkRadiusSq = Math.pow(this.checkRadius - 2, 2);
                    var n1_count = 0;
                    var n1_sum = 0;
                    var check = 0;
                    for (var x = Math.round(normal1.x - this.checkRadius); x <= Math.round(normal1.x + this.checkRadius); ++x) {
                        for (var y = Math.round(normal1.y - this.checkRadius); y <= Math.round(normal1.y + this.checkRadius); ++y) {
                            var dx = x - normal1.x;
                            var dy = y - normal1.y;
                            var distSq = dx * dx + dy * dy;
                            if (distSq <= checkRadiusSq) {
                                ++n1_count;
                                if (bd.getPixel32(x, y) != 0) {
                                    ++n1_sum;
                                }
                            }
                        }
                    }
                    if (n1_sum == 0) {
                        check += 1;
                    }
                    else if (n1_sum == n1_count) {
                        check -= 1;
                    }
                    else {
                        check = -10;
                    }
                    var n2_count = 0;
                    var n2_sum = 0;
                    for (var x = Math.round(normal2.x - this.checkRadius); x <= Math.round(normal2.x + this.checkRadius); ++x) {
                        for (var y = Math.round(normal2.y - this.checkRadius); y <= Math.round(normal2.y + this.checkRadius); ++y) {
                            var dx = x - normal2.x;
                            var dy = y - normal2.y;
                            var distSq = dx * dx + dy * dy;
                            if (distSq <= checkRadiusSq) {
                                ++n2_count;
                                if (bd.getPixel32(x, y) != 0)
                                    ++n2_sum;
                            }
                        }
                    }
                    if (n2_sum == 0) {
                        check += 1;
                    }
                    else if (n2_sum == n2_count) {
                        check -= 1;
                    }
                    else {
                        check = -10;
                    }
                    if (check != 0) {
                        all_check_ok = false;
                        console.log('check failed at t:', t, ', seg:', segment);
                        this.errorPoints.push(this._area.getContour(segment, t));
                    }
                }
            }
        }
        return all_check_ok;
    };
    Island.prototype.render = function () {
        for (var i = 0; i < this.errorPoints.length; ++i) {
            this._game.debug.geom(new Phaser.Circle(this.errorPoints[i].x, this.errorPoints[i].y, 2 * this.checkRadius), 'rgba(255,0,0,0.5)');
        }
    };
    return Island;
}());
var SimpleGame = (function () {
    function SimpleGame() {
        this.flags = new Flags();
        this.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'spline-content', {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
        this.game.load.image('water', 'assets/BigWater.png');
        this.game.load.image('sand', 'assets/light_sand_template.jpg');
        this.game.load.image('SaveButton', 'assets/SaveButton.png');
        this.game.load.image('LoadButton', 'assets/LoadButton.png');
        this.game.load.image('CheckButton', 'assets/CheckButton.png');
    };
    SimpleGame.prototype.create = function () {
        this.editorOffset = new Phaser.Point(0, 110);
        this.waterSprite = this.game.add.sprite(0, 0, 'water');
        this.flags = new Flags();
        this.flags.updateNeeded = true;
        this.islandMask = this.game.add.graphics(0, 0);
        this.islandMask.clear();
        this.sandSprite = this.game.add.sprite(0, 0, 'sand');
        this.sandSprite.mask = this.islandMask;
        this.editorArea = this.game.add.graphics(this.editorOffset.x, this.editorOffset.y);
        this.editorArea.beginFill(0xffffff, 0.1);
        this.editorArea.drawRect(0, 0, this.game.width - this.editorOffset.x, this.game.height - this.editorOffset.y);
        this.editorArea.endFill();
        this.editorArea.inputEnabled = true;
        this.multiSplineEditor = new MultiSplineEditor(this.game, this.editorArea, this.islandMask, 'balls', this.flags);
        this.multiSplineEditor.start(SimpleGame.prototype.splineCreated, this);
        this.saveButton = this.game.add.button(0, 0, 'SaveButton', SimpleGame.prototype.saveGame, this);
        this.loadButton = this.game.add.button(220, 10, 'LoadButton', SimpleGame.prototype.loadGame, this);
        this.checkButton = this.game.add.button(650, 3, 'CheckButton', SimpleGame.prototype.checkIsland, this);
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
        if (this.multiSplineEditor != undefined)
            this.multiSplineEditor.render();
        if (this.island != undefined)
            this.island.render();
    };
    SimpleGame.prototype.splineCreated = function (spline) {
        this.multiSpline = spline;
        this.multiSpline.update();
        this.island = new Island(this.game, this.multiSpline);
    };
    SimpleGame.prototype.saveGame = function () {
        if (this.multiSpline != undefined) {
            if (this.island.check()) {
                console.log('Island successfully verified');
            }
            else {
                console.log('Island verification failed');
                return;
            }
            localStorage.setItem('multispline', this.multiSpline.stringify());
            console.log('Multispline saved to local storage');
        }
        else {
            console.log('The multispline is not created, cannot save it');
        }
    };
    SimpleGame.prototype.loadGame = function () {
        var data = localStorage.getItem('multispline');
        if (data != undefined) {
            if (this.multiSpline == undefined) {
                this.multiSpline = new MultiSpline(this.game, this.editorArea, this.islandMask);
            }
            this.multiSpline.createFromString(data);
            this.multiSpline.update();
            if (this.multiSplineEditor != undefined) {
                this.multiSplineEditor.destroy();
                delete this.multiSplineEditor;
            }
            this.island = new Island(this.game, this.multiSpline);
            console.log('Multispline loaded from local storage');
        }
    };
    SimpleGame.prototype.checkIsland = function () {
        var ok;
        console.log('checking...');
        ok = this.island.check();
        console.log('Check:', ok);
        return ok;
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
