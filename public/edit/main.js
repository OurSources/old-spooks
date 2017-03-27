/*global EventTarget, location*/
var Spooks = Spooks || {};

/**************************************************\
|*Please organize the code if you have the energy!*|
\**************************************************/

/*
{
	name: "Tileset",
	src: "http://spooks.me/images/tiles/tileset.png",
	width: 40,
	height: 25
},
{
	name: "Sand",
	src: "http://spooks.me/images/tiles/sand.png",
	width: 40,
	height: 25
},
{
	name: "Caves",
	src: "http://spooks.me/images/tiles/caves.png",
	width: 40,
	height: 25
},
{
	name: "Snow",
	src: "http://spooks.me/images/tiles/snow.png",
	width: 40,
	height: 25
},
{
	name: "Indoors",
	src: "http://spooks.me/data/images/tiles/indoors.png",
	width: 40,
	height: 25
},
{
	name: "Special",
	src: "http://spooks.me/data/images/tiles/special.png",
	width: 40,
	height: 25
},
{
	name: "Transparent Tiles",
	src: "http://spooks.me/data/images/tiles/transparenttiles.png",
	width: 40,
	height: 25
},
{
	name: "House",
	src: "http://spooks.me/images/tiles/house.png",
	width: 28,
	height: 13
},
{
	name: "House2",
	src: "http://spooks.me/data/images/tiles/house2.png",
	width: 28,
	height: 13
},
{
	name: "House3",
	src: "http://spooks.me/data/images/tiles/house3.png",
	width: 28,
	height: 13
},
{
	name: "Shop",
	src: "http://spooks.me/data/images/tiles/shop.png",
	width: 15,
	height: 12
},
{
	name: "Lightning",
	src: "http://spooks.me/data/images/tiles/lightning.png",
	width: 44,
	height: 9
}
*/

Spooks.options = {
	server: "ws" + ((window.location.protocol === "https:") ? "s" : "") + "://" + location.hostname, //"ws://spooks.me",
	port: 8081,
	renderMode: "fullCanvas", // chunkCanvas
	chunkSize: 16,
	tileSize: 16,
	tilesetSize: 16384,
	drawWhileLoading: true, //Draws tiles while loading tilesets, might be slower
	tps: 30, // Ticks per second
	zoomValues: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5.5, 8],
	menuBar: [
		{title: "File", children: [
			{title: "Open", use: function() {}},
			{title: "Upload to server", use: function() {}},
			{title: "Save locally", use: function() {}}
		]},
		{title: "Edit", children: [
			{title: "Undo", use: function() {}},
			{title: "Redo", use: function() {}},
			"separator",
			{title: "Cut", use: function() {}},
			{title: "Copy", use: function() {}},
			{title: "Paste", use: function() {}},
			{title: "Delete", use: function() {}},
			"separator",
			{title: "Select all", use: function() {}},
			{title: "Select none", use: function() {}}
		]},
		{title: "View", children: [
			{title: "Toggle grid", use: function() {}},
			"separator",
			{title: "Zoom in", use: function() {}},
			{title: "Zoom out", use: function() {}},
			{title: "Reset zoom", use: function() {}}
		]},
		{title: "Map", children: [
			{title: "New tileset", use: function() {}},
			"separator",
			{title: "Resize map", use: function() {}},
			{title: "Map properties", use: function() {}}
		]},
		{title: "Help", children: [
			{title: "Documentation", use: function() {}},
			{title: "About", use: function() {}}
		]}
	]
};

// Multi-browser support
EventTarget.prototype.addEventListener = EventTarget.prototype.addEventListener || EventTarget.prototype.attachEvent || function(name, fn) {
	this[name.toLowerCase()] = fn;
};

Spooks.init = function() {
	this.tileCanvas = document.createElement("canvas");
	document.getElementById("world").appendChild(this.tileCanvas);
	this.resize();
	
	window.addEventListener("resize", this.resize);
	
	this.ui.init();
	
	new this.Chunk(0, 0).setData({
		tilesets: [0, 1],
		tiles: [
			19, 20,  21, 59, 60, 61, 99,   100,  101,  20, 20, 20, 20, 20, 20, 20,
			59, 100, 0,  1,  1,  1,  2,    19,   21,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  40, 41, 41, 41, 42,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  40, 41, 41, 41, 42,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  40, 41, 3,  81, 82,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  40, 41, 42, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  80, 81, 82, 20, 16384,16385,16386,20, 20, 20, 20, 20, 20, 20,
			20, 60,  19, 21, 99, 101,16424,16425,16426,20, 20, 20, 20, 20, 20, 20,
			100,99,  20, 60, 59, 20, 16464,16465,16466,20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20,
			20, 20,  20, 20, 20, 20, 20,   20,   20,   20, 20, 20, 20, 20, 20, 20
		]
	});
	
	this.render();
}.bind(Spooks);

window.addEventListener("load", Spooks.init);