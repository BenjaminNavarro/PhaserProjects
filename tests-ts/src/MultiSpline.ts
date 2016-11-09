enum PointType {
    Start = 0,
    StartControl,
    EndControl
}

class MultiSpline {
    game: Phaser.Game;
    mask: Phaser.Graphics;
    area: Phaser.Graphics;
    points: Array<Phaser.Point>;

    constructor(game: Phaser.Game, area: Phaser.Graphics, mask: Phaser.Graphics) {
        this.game = game;
        this.mask = mask;
        this.area = area;
    }

    create(points: Array<Phaser.Point>) {
        this.points = points;
    }

    createFromString(data: string) {
        let [x, y] = JSON.parse(data);
        let points: Array<Phaser.Point> = new Array<Phaser.Point>();
        for (let i = 0; i < x.length; ++i) {
            points.push(new Phaser.Point(x[i], y[i]));
        }
        this.create(points);
    }

    update() {
        if (this.points != undefined) {
            this.mask.clear();
            this.mask.beginFill(0xffffff);
            this.mask.drawRect(-1, -1, 1, 1);
            this.mask.drawRect(-1, this.game.height, 1, 1);
            this.mask.drawRect(this.game.width, -1, 1, 1);
            this.mask.drawRect(this.game.width, this.game.height, 1, 1);
            this.mask.moveTo(this.points[0].x, this.points[0].y);
            for (let k = 0; k < this.points.length - 3; k += 3) {
                this.mask.bezierCurveTo(
                    this.points[k + 1].x,
                    this.points[k + 1].y,
                    this.points[k + 2].x,
                    this.points[k + 2].y,
                    this.points[k + 3].x,
                    this.points[k + 3].y
                );
            }
            this.mask.bezierCurveTo(
                this.points[this.points.length - 2].x,
                this.points[this.points.length - 2].y,
                this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y,
                this.points[0].x,
                this.points[0].y
            );
            this.mask.endFill();
        }
    }

    getDerivative(segment: number, t: number): Phaser.Point {
        let tangent: Phaser.Point = new Phaser.Point();
        if (t < 0 || t > 1) {
            return tangent;
        }

        // Check if segment exists
        let start_idx: number = Math.floor(segment) * 3;
        if (start_idx > this.points.length - 1) {
            return tangent;
        }

        let p0 = this.points[start_idx];
        let p1 = this.points[start_idx + 1];
        let p2 = this.points[start_idx + 2];
        let p3 = this.points[(start_idx + 3) % this.points.length];

        //  dP(t) / dt = -3*P0*(1 - t)^2 +
        // P1*(3*(1 - t)^2 - 6*(1 - t)*t) +
        // P2*(6*(1 - t)*t - 3*t^2) +
        // 3*P3*t^2

        tangent.x = - p0.x * 3 * Math.pow(1 - t, 2)
            + p1.x * (3 * Math.pow(1 - t, 2) - 6 * (1 - t) * t)
            + p2.x * (6 * (1 - t) * t - 3 * t * t)
            + p3.x * 3 * t * t;

        tangent.y = - p0.y * 3 * Math.pow(1 - t, 2)
            + p1.y * (3 * Math.pow(1 - t, 2) - 6 * (1 - t) * t)
            + p2.y * (6 * (1 - t) * t - 3 * t * t)
            + p3.y * 3 * t * t;

        return tangent;
    }

    getContour(segment: number, t: number): Phaser.Point {
        let contour: Phaser.Point = new Phaser.Point();
        if (t < 0 || t > 1) {
            return contour;
        }

        // Check if segment exists
        let start_idx: number = Math.floor(segment) * 3;
        if (start_idx > this.points.length - 1) {
            return contour;
        }

        let p0 = this.points[start_idx];
        let p1 = this.points[start_idx + 1];
        let p2 = this.points[start_idx + 2];
        let p3 = this.points[(start_idx + 3) % this.points.length];

        // P(t) = (1 - t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2 (1-t) * P2 + t^3 * P3
        contour.x = Math.pow(1 - t, 3) * p0.x + 3 * t * Math.pow(1 - t, 2) * p1.x + 3 * Math.pow(t, 2) * (1 - t) * p2.x + Math.pow(t, 3) * p3.x;
        contour.y = Math.pow(1 - t, 3) * p0.y + 3 * t * Math.pow(1 - t, 2) * p1.y + 3 * Math.pow(t, 2) * (1 - t) * p2.y + Math.pow(t, 3) * p3.y;

        return contour;
    }

    stringify(): string {
        let content: string;
        let x: Array<number> = new Array<number>();
        let y: Array<number> = new Array<number>();

        for (let i = 0; i < this.points.length; ++i) {
            x.push(this.points[i].x);
            y.push(this.points[i].y);
        }

        content = JSON.stringify([x, y]);

        return content;
    }
}
