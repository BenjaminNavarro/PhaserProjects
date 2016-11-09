/// <reference path="../../typescript/phaser.d.ts" />
/// <reference path="Definitions.ts" />
/// <reference path="MultiSpline.ts" />
/// <reference path="MultiSplineEditor.ts"/>
/// <reference path="Island.ts"/>


class SimpleGame {
    game: Phaser.Game;
    editorArea: Phaser.Graphics;
    flags: Flags = new Flags();
    spline: Spline;
    multiSpline: MultiSpline;
    multiSplineEditor: MultiSplineEditor;
    island: Island;
    waterSprite: Phaser.Sprite;
    sandSprite: Phaser.Sprite;
    islandSprite: Phaser.Sprite;
    islandMask: Phaser.Graphics;
    saveButton: Phaser.Button;
    loadButton: Phaser.Button;
    checkButton: Phaser.Button;
    editorOffset: Phaser.Point;

    constructor() {
        this.game = new Phaser.Game(
            800,
            600,
            Phaser.CANVAS,
            'spline-content', {
                preload: this.preload,
                create: this.create,
                update: this.update,
                render: this.render
            });


        // localStorage.removeItem('multispline');
    }

    preload() {
        this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
        this.game.load.image('water', 'assets/BigWater.png');
        this.game.load.image('sand', 'assets/light_sand_template.jpg');
        this.game.load.image('SaveButton', 'assets/SaveButton.png');
        this.game.load.image('LoadButton', 'assets/LoadButton.png');
        this.game.load.image('CheckButton', 'assets/CheckButton.png');
    }

    create() {
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

        // this.bmd = this.game.make.bitmapData(this.game.width, this.game.height);
        // this.bmd.addToWorld();

        this.multiSplineEditor = new MultiSplineEditor(this.game, this.editorArea, this.islandMask, 'balls', this.flags);
        this.multiSplineEditor.start(SimpleGame.prototype.splineCreated, this);

        this.saveButton = this.game.add.button(0, 0, 'SaveButton', SimpleGame.prototype.saveGame, this);
        this.loadButton = this.game.add.button(220, 10, 'LoadButton', SimpleGame.prototype.loadGame, this);
        this.checkButton = this.game.add.button(650, 3, 'CheckButton', SimpleGame.prototype.checkIsland, this);
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
        // this.game.debug.inputInfo(32, 32);
        if (this.multiSplineEditor != undefined)
            this.multiSplineEditor.render();
        if (this.island != undefined)
            this.island.render();
    }

    splineCreated(spline: MultiSpline) {
        // this.bmd.cls();
        this.multiSpline = spline;
        this.multiSpline.update();

        this.island = new Island(this.game, this.multiSpline);
        // let data: string = this.multiSpline.stringify();
        // this.multiSpline.createFromString(data);
    }

    saveGame() {
        if (this.multiSpline != undefined) {
            if(this.island.check()) {
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
    }

    loadGame() {
        let data: string = localStorage.getItem('multispline');
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
    }

    checkIsland() : boolean {
        let ok: boolean;
        console.log('checking...');
        ok = this.island.check();
        console.log('Check:', ok);
        return ok;
    }
}

// when the page has finished loading, create our game
window.onload = () => {
    var game = new SimpleGame();
}
