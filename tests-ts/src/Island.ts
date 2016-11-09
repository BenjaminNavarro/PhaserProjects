class Island {
    private _area: MultiSpline;
    private _game: Phaser.Game;
    checkRadius: number; //Used to check the topology of the island to verify that units can land from the sea or move through it

    normals1: Array<Phaser.Point> = new Array<Phaser.Point>();
    normals2: Array<Phaser.Point> = new Array<Phaser.Point>();
    tangents: Array<Phaser.Point> = new Array<Phaser.Point>();
    contours: Array<Phaser.Point> = new Array<Phaser.Point>();
    errorPoints: Array<Phaser.Point> = new Array<Phaser.Point>();

    constructor(game: Phaser.Game, area: MultiSpline) {
        this._game = game;
        this._area = area;
        this.checkRadius = 20;
    }

    check(): boolean {
        let segment: number = 0;
        let subDiv = 10;
        let tex = this._area.mask.generateTexture();
        let img = this._game.make.image(0, 0, tex);
        let bd = this._game.make.bitmapData(this._game.width+2, this._game.height+2);
        bd.copy(img);
        bd.update();

        // let sprite = this._game.add.sprite(-1,-1,bd);

        let count = 0;
        for(let i=0; i<bd.pixels.length; ++i) {
            if(bd.pixels[i] != 0)
                ++count;
        }

        console.log('path:', this._area.points);

        console.log("count:", count);

        console.log("w:", img.width, ", h:", img.height);
        console.log("tex w:", tex.width, ", tex h:", tex.height);
        console.log("data length:", bd.data.length);
        console.log("pixels length:", bd.pixels.length);

        this.normals1 = new Array<Phaser.Point>();
        this.normals2 = new Array<Phaser.Point>();
        this.tangents = new Array<Phaser.Point>();
        this.contours = new Array<Phaser.Point>();
        this.errorPoints = new Array<Phaser.Point>();

        let all_check_ok: boolean = true;
        for (segment = 0; segment < this._area.points.length / 3; ++segment) {
            console.log("Segment:", segment);
            for (let t = 0; t <= 1; t += 1 / subDiv) {
                let contour: Phaser.Point = this._area.getContour(segment, t);
                let tangent: Phaser.Point = this._area.getDerivative(segment, t);
                // console.log('At t:'+t.toString()+', point: '+contour.x.toString()+','+contour.y.toString()+'\t,tangent: '+tangent.x.toString()+','+tangent.y.toString());

                let normal1: Phaser.Point = new Phaser.Point(tangent.x, tangent.y);
                // normal1.rotate(contour.x, contour.y, 90, true, this.checkRadius);
                //
                let normal2: Phaser.Point = new Phaser.Point(tangent.x, tangent.y);
                // normal2.rotate(contour.x, contour.y, -90, true, this.checkRadius);

                // let normal1: Phaser.Point;
                normal1.perp();
                normal1.setMagnitude(this.checkRadius);
                normal1.add(contour.x, contour.y);

                // let normal2: Phaser.Point;
                normal2.rperp();
                normal2.setMagnitude(this.checkRadius);
                normal2.add(contour.x, contour.y);

                // console.log('\tn1: '+normal1.x.toString()+','+normal1.y.toString()+'\t,n2: '+normal2.x.toString()+','+normal2.y.toString());

                this.normals1.push(normal1);
                this.normals2.push(normal2);
                this.tangents.push(tangent);
                this.contours.push(contour);

                if (true || t == 0 && segment == 0) {
                    let checkRadiusSq = Math.pow(this.checkRadius-2, 2);
                    // First normal
                    // console.log('First normal');
                    let n1_count = 0;
                    let n1_sum = 0;
                    let check = 0;
                    for (let x = Math.round(normal1.x - this.checkRadius); x <= Math.round(normal1.x + this.checkRadius); ++x) {
                        for (let y = Math.round(normal1.y - this.checkRadius); y <= Math.round(normal1.y + this.checkRadius); ++y) {
                            // check if (x,y) inside check circle
                            let dx = x - normal1.x;
                            let dy = y - normal1.y;
                            let distSq = dx * dx + dy * dy;

                            if (distSq <= checkRadiusSq) {
                                ++n1_count;
                                if(bd.getPixel32(x,y) != 0) {
                                    ++n1_sum;
                                }
                            }

                        }
                    }
                    if(n1_sum == 0) {
                        // console.log('Sea');
                        check += 1;
                    }
                    else if(n1_sum == n1_count) {
                        // console.log('Land');
                        check -= 1;
                    }
                    else {
                        // console.log('Sea/Land mix');
                        check = -10;
                    }
                    // Second normal
                    // console.log('Second normal');
                    let n2_count = 0;
                    let n2_sum = 0;
                    for (let x = Math.round(normal2.x - this.checkRadius); x <= Math.round(normal2.x + this.checkRadius); ++x) {
                        for (let y = Math.round(normal2.y - this.checkRadius); y <= Math.round(normal2.y + this.checkRadius); ++y) {
                            // check if (x,y) inside check circle
                            let dx = x - normal2.x;
                            let dy = y - normal2.y;
                            let distSq = dx * dx + dy * dy;

                            if (distSq <= checkRadiusSq) {
                                ++n2_count;
                                if(bd.getPixel32(x,y) != 0)
                                    ++n2_sum;
                            }

                        }
                    }
                    if(n2_sum == 0) {
                        // console.log('Sea');
                        check += 1;
                    }
                    else if(n2_sum == n2_count) {
                        // console.log('Land');
                        check -= 1;
                    }
                    else {
                        check = -10;
                        // console.log('Sea/Land mix');
                    }
                    if(check != 0) {
                        all_check_ok = false;
                        console.log('check failed at t:', t, ', seg:', segment);
                        this.errorPoints.push(this._area.getContour(segment, t));
                    }
                }
            }

        }
        return all_check_ok;
    }

    render() {
        for (let i = 0; i < this.errorPoints.length; ++i) {
                this._game.debug.geom(new Phaser.Circle(this.errorPoints[i].x, this.errorPoints[i].y, 2 * this.checkRadius), 'rgba(255,0,0,0.5)');
        }
        // for (let i = 0; i < this.normals1.length; ++i) {
        // if(this.normals1.length > 0) {
        //     let i=0;
        //     this._game.debug.geom(this.normals1[i], 'rgba(255,0,0,1)');
        //     this._game.debug.geom(this.normals2[i], 'rgba(0,255,0,1)');
        //     // this._game.debug.geom(new Phaser.Line(this.contours[i].x, this.contours[i].y,this.contours[i].x + this.tangents[i].x, this.contours[i].y + this.tangents[i].y), 'rgba(0,255,0,1)');
        //     this._game.debug.geom(new Phaser.Circle(this.normals1[i].x, this.normals1[i].y, 2 * this.checkRadius), 'rgba(255,0,0,0.5)');
        //     this._game.debug.geom(new Phaser.Circle(this.normals2[i].x, this.normals2[i].y, 2 * this.checkRadius), 'rgba(0,255,0,0.5)');
        // }
    }
}
