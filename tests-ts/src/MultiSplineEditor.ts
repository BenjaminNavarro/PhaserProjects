
class MultiSplineEditor {
    private _game: Phaser.Game;
    private _area: Phaser.Graphics;
    private _spriteSheet: string;
    private _flags: Flags;
    private _onCompletionCallback: () => MultiSpline;
    private _lines: Array<Phaser.Line>;
    private _data: Array<Array<Phaser.Line>>;
    private _currentLine: Phaser.Line;
    private _dropZone: Phaser.Circle;
    private _tracing: boolean;
    private _callback: (MultiSpline) => void;
    private _sprites: Array<Phaser.Sprite>;
    private _last_sprites_pos: Array<Phaser.Point>;
    private _spline: MultiSpline;
    private _drawingArea: Phaser.Graphics;


    constructor(game: Phaser.Game, area: Phaser.Graphics, mask: Phaser.Graphics, spriteSheet: string, flags: Flags) {
        this._game = game;
        this._area = area;
        this._spriteSheet = spriteSheet;
        this._flags = flags;

        this._lines = new Array<Phaser.Line>();
        this._data = new Array<Array<Phaser.Line>>();

        this._spline = new MultiSpline(game, area, mask);

        // this._drawingArea = new Phaser.Graphics(game, area.x, area.y);
        this._drawingArea = game.add.graphics(area.x, area.y);
        this._drawingArea.beginFill(0xffffff, 0);
        this._drawingArea.drawRect(0, 0, game.width - area.x, game.height - area.y);
        this._drawingArea.endFill();

    }

    start(onCompletion: (MultiSpline) => void, context: any) {
        // this._game.input.onDown.add(this.onPointerDown, this);
        this._drawingArea.inputEnabled = true;
        this._drawingArea.events.onInputDown.add(this.onPointerDown, this);
        this._game.input.addMoveCallback(this.pointerMoved, this);
        this._callback = onCompletion.bind(context);

        this._drawingArea.lineStyle(1, 0x00ff00, 1.0);
    }

    private onPointerDown(object_Clicked: any, pointer: Phaser.Pointer) {
        // console.log(pointer.x, pointer.y);
        if (this._tracing) {
            //  End line
            var x = this._currentLine.end.x;
            var y = this._currentLine.end.y;

            console.log(x, y);

            let clone = new Phaser.Line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y);
            this._lines.push(clone);
            // this._bmd.line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y, '#00ff00');
            this._drawingArea.lineTo(x - this._drawingArea.left, y - this._drawingArea.top);

            //  If it closes the line then quit
            if (x === this._dropZone.x && y === this._dropZone.y) {
                let lines: Array<Phaser.Line> = this._lines.slice(0);
                this._data.push(lines);
                this._lines = new Array<Phaser.Line>();
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
    }

    private isPointInArea(point: any): boolean {
        let [x, y] = [point.x, point.y];
        return (x >= this._drawingArea.left && x <= this._drawingArea.right && y >= this._drawingArea.top && y <= this._drawingArea.bottom);
    }

    private pointerMoved(pointer: Phaser.Pointer) {
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
    }

    private stop() {
        this._drawingArea.clear();
        this._drawingArea.beginFill(0xffffff, 0);
        this._drawingArea.drawRect(0, 0, this._game.width - this._area.x, this._game.height - this._area.y);
        this._drawingArea.endFill();

        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);

        if (this._sprites != undefined) {
            for (let p = 0; p < this._sprites.length; p++) {
                this._sprites[p].destroy();
            }
        }

        this._sprites = new Array<Phaser.Sprite>();
        this._last_sprites_pos = new Array<Phaser.Point>();

        let path: Array<Phaser.Line> = this._data[this._data.length - 1];

        let setupSprite = (pt: Phaser.Point, idx: number) => {
            this._sprites.push(this._game.add.sprite(pt.x, pt.y, this._spriteSheet, idx % 3));

            this._sprites[idx].anchor.set(0.5);
            this._sprites[idx].inputEnabled = true;
            this._sprites[idx].input.enableDrag(true);
            this._sprites[idx].events.onDragUpdate.add(this.onDrag, this);
        }

        for (let i = 0; i < path.length; ++i) {
            let pt = path[i].start; // passing point
            let start_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.);
            let end_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 1.);

            this._last_sprites_pos = this._last_sprites_pos.concat([pt, start_ctrl, end_ctrl]);

            setupSprite(pt, 3 * i);
            setupSprite(start_ctrl, 3 * i + 1);
            setupSprite(end_ctrl, 3 * i + 2);
        }

        // Trigger a check on every sprite
        for (let p = 0; p < this._sprites.length; p++) {
            this.onDrag(this._sprites[p]);
        }

        this._spline.create(this._last_sprites_pos);
        this._callback(this._spline);
    }


    render() {
        if (this._currentLine) {
            if (this._dropZone.contains(this._currentLine.end.x, this._currentLine.end.y)) {
                this._game.debug.geom(this._currentLine, '#ffff00');
            }
            else {
                this._game.debug.geom(this._currentLine, '#00ff00');
            }
        }
    }

    update() {
        this._spline.update();
    }

    destroy() {
        this._drawingArea.inputEnabled = false;
        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);

        if (this._sprites != undefined) {
            for (let p = 0; p < this._sprites.length; p++) {
                this._sprites[p].destroy();
            }
        }

        this._drawingArea.clear();

        delete this._lines;
        delete this._data;
    }

    private onDrag(sprite: any) {
        if (this.isPointInArea(sprite)) {
            this._flags.updateNeeded = true;
            let pt: number = this._sprites.indexOf(sprite);
            let type: PointType = pt % 3;
            let dx: number;
            let dy: number;
            switch (type) {
                case PointType.Start:
                    dx = this._sprites[pt].x - this._last_sprites_pos[pt].x;
                    dy = this._sprites[pt].y - this._last_sprites_pos[pt].y;

                    let prev_ctrl: Phaser.Sprite = this.getSpriteByIndex(pt - 1);
                    let next_ctrl: Phaser.Sprite = this.getSpriteByIndex(pt + 1);

                    prev_ctrl.x += dx;
                    prev_ctrl.y += dy;
                    next_ctrl.x += dx;
                    next_ctrl.y += dy;
                    break;
                case PointType.StartControl:
                    prev_ctrl = this.getSpriteByIndex(pt - 2);
                    let prev_point: Phaser.Sprite = this.getSpriteByIndex(pt - 1);

                    dx = this._sprites[pt].x - prev_point.x;
                    dy = this._sprites[pt].y - prev_point.y;
                    prev_ctrl.x = prev_point.x - dx;
                    prev_ctrl.y = prev_point.y - dy;
                    break;
                case PointType.EndControl:
                    next_ctrl = this.getSpriteByIndex(pt + 2);
                    let next_point: Phaser.Sprite = this.getSpriteByIndex(pt + 1);

                    dx = this._sprites[pt].x - next_point.x;
                    dy = this._sprites[pt].y - next_point.y;
                    next_ctrl.x = next_point.x - dx;
                    next_ctrl.y = next_point.y - dy;
                    break;
            }
            for (let p = 0; p < this._sprites.length; p++) {
                this._last_sprites_pos[p].x = this._sprites[p].x;
                this._last_sprites_pos[p].y = this._sprites[p].y;

            }
        }
    }


    private getSpriteByIndex(n: number): Phaser.Sprite {
        if (n < 0) {
            return this._sprites[this._sprites.length + (n % -this._sprites.length)];
        }
        else {
            return this._sprites[n % this._sprites.length];
        }
    }
}
