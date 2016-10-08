/// <reference path="../../typescript/phaser.d.ts" />
/// <reference path="Spline.ts" />
/// <reference path="MultiSpline.ts" />
/// <reference path="Definitions.ts" />


class SimpleGame
{
	game: Phaser.Game;
	bmd: Phaser.BitmapData;
	flags: Flags = new Flags();
	spline: Spline;
	multiSpline: MultiSpline;

	constructor()
	{
		// create our phaser game
		// 800 - width
		// 600 - height
		// Phaser.AUTO - determine the renderer automatically (canvas, webgl)
		// 'content' - the name of the container to add our game to
		// { preload:this.preload, create:this.create} - functions to call for our states
		this.game = new Phaser.Game( 
			800, 
			600, 
			Phaser.AUTO, 
			'spline-content', { 
			preload:this.preload, 
			create:this.create, 
			update:this.update});
		// this.splines = new Array<Spline>();
	}
	
	preload()
	{
		this.game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
	}
	
	create()
	{
		this.flags = new Flags();
		this.flags.updateNeeded = true;

		this.game.stage.backgroundColor = '#204090';

		this.bmd = this.game.add.bitmapData(this.game.width, this.game.height);
		this.bmd.addToWorld();

		this.multiSpline = new MultiSpline(this.game, 'balls', this.bmd, this.flags);
		this.multiSpline.points = [
			new Phaser.Point(100,300),
			new Phaser.Point(200,400),
			new Phaser.Point(300,200),
			new Phaser.Point(400,300),
			new Phaser.Point(500,200),
			new Phaser.Point(600,400),
			new Phaser.Point(700,300)];
		this.multiSpline.create();
		this.multiSpline.update();

		// this.spline = new Spline(this.game, 'balls', this.bmd, this.flags);
		// this.spline.points = [
		// 	new Phaser.Point(100,300),
		// 	new Phaser.Point(200,400),
		// 	new Phaser.Point(300,200),
		// 	new Phaser.Point(400,300)];
		// this.spline.create();
		// this.spline.update();

		// this.splines[1] = new Spline(this.game, 'balls', this.bmd, this.flags);
		// this.splines[1].points = [
		// 	new Phaser.Point(600,400),
		// 	new Phaser.Point(700,300),
		// 	new Phaser.Point(500,200),
		// 	new Phaser.Point(600,100)];

		// for(var p=0; p<this.splines.length; p++) {
		// 	this.splines[p].create();
		// 	this.splines[p].update();
		// }
	}

	update()
	{
		if(this.flags.updateNeeded) {
			this.flags.updateNeeded = false;
			this.bmd.clear();
			this.multiSpline.update();
			// this.spline.update();
			// for(var p=0; p<this.splines.length; p++) {
			// 	this.splines[p].update();
			// }
  		}
	}
}

// when the page has finished loading, create our game
window.onload = () => {
	var game = new SimpleGame();
}