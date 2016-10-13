enum PointType {
    Start = 0,
    StartControl,
    EndControl
}

class MultiSpline {
    game: Phaser.Game;
    spriteSheet: string;
    mask: Phaser.Graphics;
    flags: Flags;
    sprites: Array<Phaser.Sprite> = new Array<Phaser.Sprite>();
    private last_sprites_pos: Array<Phaser.Point> = new Array<Phaser.Point>();

    constructor(game: Phaser.Game, mask: Phaser.Graphics, spriteSheet: string, flags: Flags) {
        this.game = game;
        this.mask = mask;
        this.spriteSheet = spriteSheet;
        this.flags = flags;
        this.flags.updateNeeded = false;
    }

    create(points: Array<Phaser.Point>) {
        for (let p = 0; p < points.length; p++) {
            this.sprites.push(this.game.add.sprite(points[p].x, points[p].y, this.spriteSheet, p % 3));
            this.last_sprites_pos.push(new Phaser.Point(points[p].x, points[p].y));
            this.sprites[p].anchor.set(0.5);
            this.sprites[p].inputEnabled = true;
            this.sprites[p].input.enableDrag(true);
            this.sprites[p].events.onDragUpdate.add(this.onDrag, this);
        }
        for (let p = 0; p < this.sprites.length; p++) {
            this.onDrag(this.sprites[p]);
        }
    }

    update() {
        this.mask.clear();
        this.mask.beginFill(0xffffff);
        this.mask.moveTo(this.sprites[0].x, this.sprites[0].y);
        for (let k = 0; k < this.sprites.length - 3; k += 3) {
            this.mask.bezierCurveTo(
                this.sprites[k + 1].x,
                this.sprites[k + 1].y,
                this.sprites[k + 2].x,
                this.sprites[k + 2].y,
                this.sprites[k + 3].x,
                this.sprites[k + 3].y
            );
        }
        this.mask.bezierCurveTo(
            this.sprites[this.sprites.length - 2].x,
            this.sprites[this.sprites.length - 2].y,
            this.sprites[this.sprites.length - 1].x,
            this.sprites[this.sprites.length - 1].y,
            this.sprites[0].x,
            this.sprites[0].y
        );
        this.mask.endFill();
    }

    onDrag(sprite: any) {
        this.flags.updateNeeded = true;
        let pt = this.sprites.indexOf(sprite);
        let type: PointType = pt % 3;
        let dx: number;
        let dy: number;
        switch (type) {
            case PointType.Start:
                dx = this.sprites[pt].x - this.last_sprites_pos[pt].x;
                dy = this.sprites[pt].y - this.last_sprites_pos[pt].y;

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

                dx = this.sprites[pt].x - prev_point.x;
                dy = this.sprites[pt].y - prev_point.y;
                prev_ctrl.x = prev_point.x - dx;
                prev_ctrl.y = prev_point.y - dy;
                break;
            case PointType.EndControl:
                next_ctrl = this.getSpriteByIndex(pt + 2);
                let next_point: Phaser.Sprite = this.getSpriteByIndex(pt + 1);

                dx = this.sprites[pt].x - next_point.x;
                dy = this.sprites[pt].y - next_point.y;
                next_ctrl.x = next_point.x - dx;
                next_ctrl.y = next_point.y - dy;
                break;
        }
        for (let p = 0; p < this.sprites.length; p++) {
            this.last_sprites_pos[p].x = this.sprites[p].x;
            this.last_sprites_pos[p].y = this.sprites[p].y;
        }
    }

    getSpriteByIndex(n: number): Phaser.Sprite {
        if (n < 0) {
            return this.sprites[this.sprites.length + (n % -this.sprites.length)];
        }
        else {
            return this.sprites[n % this.sprites.length];
        }
    }
}
