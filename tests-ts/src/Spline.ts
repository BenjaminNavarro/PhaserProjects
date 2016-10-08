/// <reference path="Definitions.ts" />

class Spline
{
	game:Phaser.Game;
    spriteSheet:string;
    bmd:Phaser.BitmapData;
    flags:Flags;
    points:Array<Phaser.Point> = new Array<Phaser.Point>(4);
	sprites:Array<Phaser.Sprite> = new Array<Phaser.Sprite>(4);

	constructor(game:Phaser.Game, spriteSheet:string, bmd:Phaser.BitmapData, flags:Flags)
	{
        this.game = game;
        this.spriteSheet = spriteSheet;
        this.bmd = bmd;
        this.flags = flags;

        let pt = new Phaser.Point(0,0);
        for(var p=0; p<4; ++p) {
            this.points[p] = pt;
        }
    }
	
	create()
	{
        for (var p = 0; p < this.points.length; p++)
        {
            this.sprites[p] = this.game.add.sprite(this.points[p].x, this.points[p].y, this.spriteSheet, p);
            this.sprites[p].anchor.set(0.5);
            this.sprites[p].inputEnabled = true;
            this.sprites[p].input.enableDrag(true);
            this.sprites[p].events.onDragUpdate.add(function(){this.flags.updateNeeded = true;}, this);
        }
	}

    update()
    {
        let x: number = 1 / this.game.width;
        let x_pts: number[] = new Array<number>();
        let y_pts: number[] = new Array<number>();

        for (var i = 0; i < this.points.length; i++) {
            this.points[i].x = this.sprites[i].x;
            this.points[i].y = this.sprites[i].y;
            x_pts.push(this.points[i].x);
            y_pts.push(this.points[i].y);
        }

        for (var i: number = 0; i <= 1; i += x)
        {
            var px = Phaser.Math.bezierInterpolation(x_pts, i);
            var py = Phaser.Math.bezierInterpolation(y_pts, i);
            this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
        }
    }
}