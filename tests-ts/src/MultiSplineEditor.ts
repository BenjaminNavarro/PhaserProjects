
class MultiSplineEditor {
    private _game: Phaser.Game;
    private _spriteSheet: string;
    private _bmd: Phaser.BitmapData;
    private _flags: Flags;
    private _onCompletionCallback: () => MultiSpline;
    private _lines: Array<Phaser.Line>;
    private _data: Array<Array<Phaser.Line>>;
    private _currentLine: Phaser.Line;
    private _dropZone: Phaser.Circle;
    private _tracing: boolean;
    private _callback: (MultiSpline) => void;

    constructor(game: Phaser.Game, spriteSheet: string, bmd: Phaser.BitmapData, flags: Flags) {
        this._game = game;
        this._spriteSheet = spriteSheet;
        this._bmd = bmd;
        this._flags = flags;

        this._lines = new Array<Phaser.Line>();
        this._data = new Array<Array<Phaser.Line>>();
    }

    start(onCompletion: (MultiSpline) => void, context: any) {
        this._game.input.onDown.add(this.onPointerDown, this);
        this._game.input.addMoveCallback(this.pointerMoved, this);
        this._callback = onCompletion.bind(context);
    }

    private onPointerDown(pointer: Phaser.Pointer) {
        if (this._tracing) {
            //  End line
            var x = this._currentLine.end.x;
            var y = this._currentLine.end.y;

            let clone = new Phaser.Line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y);
            this._lines.push(clone);

            this._bmd.line(this._currentLine.start.x, this._currentLine.start.y, this._currentLine.end.x, this._currentLine.end.y, '#00ff00');

            //  If it closes the line then quit
            if (x === this._dropZone.x && y === this._dropZone.y) {
                let lines: Array<Phaser.Line> = this._lines.slice(0);
                this._data.push(lines);
                this._lines = new Array<Phaser.Line>();
                this._currentLine = null;
                this._tracing = false;
                // this.redraw();
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
    }

    private pointerMoved(pointer: Phaser.Pointer) {
        if (this._currentLine) {
            if (this._dropZone.contains(pointer.x, pointer.y) && this._lines.length > 1) {
                this._currentLine.end.setTo(this._dropZone.x, this._dropZone.y);
            }
            else {
                this._currentLine.end.setTo(pointer.x, pointer.y);
            }
        }
    }

    private stop() {
        this._game.input.onDown.remove(this.onPointerDown, this);
        this._game.input.deleteMoveCallback(this.pointerMoved, this);

        let path: Array<Phaser.Line> = this._data[this._data.length - 1];

        let spline: MultiSpline = new MultiSpline(this._game, this._spriteSheet, this._bmd, this._flags);
        let points: Array<Phaser.Point> = new Array<Phaser.Point>();
        for (let i = 0; i < path.length; ++i) {
            points.push(path[i].start); // passing point
            let start_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.2);
            let end_ctrl = Phaser.Point.interpolate(path[i].start, path[i].end, 0.8);
            let angle = Phaser.Point.angle(path[i].start, path[i].end);
            let rot: number;
            if (angle > 0) {
                rot = 30;
            }
            else {
                rot = -30;
            }
            // points.push(start_ctrl.rotate(path[i].start.x, path[i].start.y, rot, true)); // First control point
            points.push(start_ctrl); // First control point
            points.push(end_ctrl); // Second control point
            console.log('Angle:', Phaser.Point.angle(path[i].start, path[i].end));
        }
        spline.create(points);
        spline.flags.updateNeeded = true;
        this._callback(spline);
    }

    redraw() {
        this._bmd.cls();
        this._bmd.ctx.fillStyle = '#00aa00';

        for (var i = 0; i < this._data.length; i++) {
            let path: Array<Phaser.Line> = this._data[i];

            this._bmd.ctx.beginPath();

            this._bmd.ctx.moveTo(path[0].start.x, path[0].start.y);

            for (var n = 0; n < path.length; n++) {
                this._bmd.ctx.lineTo(path[n].end.x, path[n].end.y);
            }

            this._bmd.ctx.closePath();

            this._bmd.ctx.fill();
        }

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
}
