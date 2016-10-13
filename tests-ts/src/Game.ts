/// <reference path="../../typescript/phaser.d.ts" />
/// <reference path="Definitions.ts" />
/// <reference path="MultiSpline.ts" />
/// <reference path="MultiSplineEditor.ts"/>


class SimpleGame {
    game: Phaser.Game;
    bmd: Phaser.BitmapData;
    flags: Flags = new Flags();
    spline: Spline;
    multiSpline: MultiSpline;
    multiSplineEditor: MultiSplineEditor;
    waterSprite: Phaser.Sprite;
    sandSprite: Phaser.Sprite;
    islandSprite: Phaser.Sprite;
    islandMask: Phaser.Graphics;

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
    }

    preload() {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
        this.game.load.image('water', 'assets/BigWater.png');
        this.game.load.image('sand', 'assets/light_sand_template.jpg');
    }

    create() {
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
    }

    update() {
        if (this.flags.updateNeeded) {
            this.flags.updateNeeded = false;
            if (this.multiSpline != undefined) {
                this.multiSpline.update();
            }
        }
    }

    render() {
        this.multiSplineEditor.render();
    }

    splineCreated(spline: MultiSpline) {
        this.bmd.cls();
        this.multiSpline = spline;
        this.multiSpline.update();
    }
}

// when the page has finished loading, create our game
window.onload = () => {
    var game = new SimpleGame();
}
