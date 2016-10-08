/// <reference path="Definitions.ts" />

enum PointType {
    Start = 0,
    StartControl,
    EndControl
}

class MultiSpline
{
	game:Phaser.Game;
    spriteSheet:string;
    bmd:Phaser.BitmapData;
    flags:Flags;
    points:Array<Phaser.Point> = new Array<Phaser.Point>(7);
	sprites:Array<Phaser.Sprite> = new Array<Phaser.Sprite>(7);

	constructor(game:Phaser.Game, spriteSheet:string, bmd:Phaser.BitmapData, flags:Flags)
	{
        this.game = game;
        this.spriteSheet = spriteSheet;
        this.bmd = bmd;
        this.flags = flags;

        let pt = new Phaser.Point(0,0);
        for(let p=0; p<this.points.length; ++p) {
            this.points[p] = pt;
        }
    }
	
	create()
	{
        for (let p = 0; p < this.sprites.length; p++)
        {
            this.sprites[p] = this.game.add.sprite(this.points[p].x, this.points[p].y, this.spriteSheet, p%3);
            this.sprites[p].anchor.set(0.5);
            this.sprites[p].inputEnabled = true;
            this.sprites[p].input.enableDrag(true);
            this.sprites[p].events.onDragUpdate.add(this.onDrag, this);
        }
        for (let p = 0; p < this.sprites.length; p++)
        {
            this.onDrag(this.sprites[p]);
        }
	}

    update()
    {
        for (let k = 0; k < this.points.length - 3; k+=3) {
            let x: number = 1 / this.game.width;
            let x_pts: number[] = new Array<number>();
            let y_pts: number[] = new Array<number>();

            for (let i = k; i < k+4; i++) {
                this.points[i].x = this.sprites[i].x;
                this.points[i].y = this.sprites[i].y;
                x_pts.push(this.points[i].x);
                y_pts.push(this.points[i].y);
            }

            for (let p = 0; p <= 1; p += x)
            {
                let px = Phaser.Math.bezierInterpolation(x_pts, p);
                let py = Phaser.Math.bezierInterpolation(y_pts, p);
                this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
            }
        }

    }

    onDrag(sprite: any) {
        this.flags.updateNeeded = true;
        let pt = this.sprites.indexOf(sprite);
        let type: PointType = pt%3;
        let dx: number;
        let dy: number;
        switch(type) {
            case PointType.Start:
                dx = this.sprites[pt].x - this.points[pt].x;
                dy = this.sprites[pt].y - this.points[pt].y;
                if (pt == 0) {
                    this.sprites[pt+1].x += dx;
                    this.sprites[pt+1].y += dy;
                }
                else if (pt == this.points.length - 1) {
                    this.sprites[pt-1].x += dx;
                    this.sprites[pt-1].y += dy;
                }
                else {
                    this.sprites[pt-1].x += dx;
                    this.sprites[pt-1].y += dy;
                    this.sprites[pt+1].x += dx;
                    this.sprites[pt+1].y += dy;
                }
            break;
            case PointType.StartControl:
                if (pt != 1) {
                    dx = this.sprites[pt].x - this.sprites[pt-1].x;
                    dy = this.sprites[pt].y - this.sprites[pt-1].y;
                    this.sprites[pt-2].x = this.sprites[pt-1].x - dx;
                    this.sprites[pt-2].y = this.sprites[pt-1].y - dy;
                }
            break;
            case PointType.EndControl:
                if (pt != this.points.length - 2) {
                    dx = this.sprites[pt].x - this.sprites[pt+1].x;
                    dy = this.sprites[pt].y - this.sprites[pt+1].y;
                    this.sprites[pt+2].x = this.sprites[pt+1].x - dx;
                    this.sprites[pt+2].y = this.sprites[pt+1].y - dy;
                }
            break;
        }
        for (let p = 0; p < this.sprites.length; p++)
        {
            this.points[p].x = this.sprites[p].x;
            this.points[p].y = this.sprites[p].y;
        }
    }
}