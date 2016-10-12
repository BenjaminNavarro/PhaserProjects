/// <reference path="../../typescript/phaser.d.ts" />
/// <reference path="Definitions.ts" />
/// <reference path="Spline.ts" />
/// <reference path="MultiSpline.ts" />
/// <reference path="MultiSplineEditor.ts"/>


class SimpleGame {
    game: Phaser.Game;
    bmd: Phaser.BitmapData;
    flags: Flags = new Flags();
    spline: Spline;
    multiSpline: MultiSpline;
    multiSpline2: MultiSpline;
    multiSplineEditor: MultiSplineEditor;

    constructor() {
        // create our phaser game
        // 800 - width
        // 600 - height
        // Phaser.AUTO - determine the renderer automatically (canvas, webgl)
        // 'content' - the name of the container to add our game to
        // { preload:this.preload, create:this.create} - functions to call for our states
        this.game = new Phaser.Game(
            800,
            600,
            Phaser.CANVAS,
            'spline-content', {
                preload: this.preload,
                create: this.create,
                update: this.update,
                render: this.render,
                splineCreated: this.splineCreated
            });
        // this.splines = new Array<Spline>();
    }

    preload() {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
    }

    create() {
        this.flags = new Flags();
        this.flags.updateNeeded = true;

        this.game.stage.backgroundColor = '#204090';

        this.bmd = this.game.make.bitmapData(this.game.width, this.game.height);
        this.bmd.addToWorld();

        this.multiSplineEditor = new MultiSplineEditor(this.game, 'balls', this.bmd, this.flags);
        this.multiSplineEditor.start(this.splineCreated, this);

        // this.multiSpline = new MultiSpline(this.game, 'balls', this.bmd, this.flags);
        // let points: Phaser.Point[] = [
        //     new Phaser.Point(100, 300),
        //     new Phaser.Point(200, 400),
        //     new Phaser.Point(300, 200),
        //     new Phaser.Point(400, 300),
        //     new Phaser.Point(500, 200),
        //     new Phaser.Point(600, 400),
        //     new Phaser.Point(700, 300),
        //     new Phaser.Point(600, 400),
        //     new Phaser.Point(700, 300)];
        //
        // this.multiSpline.create(points);
        // this.multiSpline.update();
        //
        // this.multiSpline2 = new MultiSpline(this.game, 'balls', this.bmd, this.flags);
        // for (let p = 0; p < points.length; ++p) {
        //     points[p].y += 200;
        // }
        //
        // this.multiSpline2.create(points);
        // this.multiSpline2.update();
    }

    update() {
        if (this.flags.updateNeeded) {
            this.flags.updateNeeded = false;
            this.bmd.cls();
            if (this.multiSpline != undefined) {
                this.multiSpline.update();
            }
            // this.multiSpline2.update();
        }
    }

    render() {
        this.multiSplineEditor.render();
    }

    splineCreated(spline: MultiSpline) {
        this.multiSpline = spline;
        this.bmd.cls();
        this.multiSpline.update();
    }
}

// when the page has finished loading, create our game
window.onload = () => {
    var game = new SimpleGame();
}
