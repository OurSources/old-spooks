/*global EventTarget, location*/
var Spooks = Spooks || {};

Spooks.options = {
	server: "ws" + ((window.location.protocol === "https:") ? "s" : "") + "://" + location.hostname, //"ws://spooks.me",
	port: 8081,
	renderMode: "fullCanvas", // chunkCanvas
	chunkSize: 16,
	tileSize: 16,
	tilesetSize: 16384,
	drawWhileLoading: true, //Draws tiles while loading tilesets, might be slower
	tps: 30 // Ticks per second
};

Spooks.keysDown = [];

// Multi-browser support
Object.prototype.addEventListener = Object.prototype.addEventListener || EventTarget.prototype.addEventListener || EventTarget.prototype.attachEvent || function(name, fn) {
	this["on" + name.toLowerCase()] = fn;
};

Spooks.resize = function() {
	if (this.options.renderMode == "fullCanvas") {
		this.tileCanvas.width = window.innerWidth;
		this.tileCanvas.height = window.innerHeight;
	}
}.bind(Spooks);

Spooks.init = function() {
	if (this.options.renderMode == "chunkCanvas") {
		document.getElementById("world").innerHTML = "<div id=\"chunks\"></div><div id=\"objects\"></div><div id=\"players\"></div>";
	} else if (this.options.renderMode == "fullCanvas") {
    	this.tileCanvas = document.createElement("canvas");
    	document.getElementById("world").appendChild(this.tileCanvas);
    	this.resize();
    	this.render();
    }
	
	this.ui.init();
	
  //new this.ui.Window(300, 200, 400, 200, "Test Window", document.createElement("div"), true, 50, 50);
	
    this.net.init();
    
    window.addEventListener("resize", this.resize);

    window.addEventListener("keydown", function(event) {
    	var keyCode = event.which || event.keyCode;
    	if (!this.keysDown.includes(keyCode))
    		this.keysDown.push(keyCode);
    }.bind(this));
    
    window.addEventListener("keyup", function(event) {
    	var keyCode = event.which || event.keyCode;
    	if (this.keysDown.includes(keyCode))
    		this.keysDown.splice(this.keysDown.indexOf(keyCode), 1);
    }.bind(this));
    
    //move camera to the middle
    //this.camera.x = -((document.getElementById("world").getBoundingClientRect().width  / 2) - ((this.options.chunkSize * this.options.tileSize) / 2));
    //this.camera.y =   (document.getElementById("world").getBoundingClientRect().height / 2) - ((this.options.chunkSize * this.options.tileSize) / 2) ;
    
    setInterval(this.tick, 1000 / this.options.tps);
}.bind(Spooks);

Spooks.tick = function() {
	if (this.keysDown.includes(38) || this.keysDown.includes(87)) { // Up
		this.camera.y += 8;
	}
	if (this.keysDown.includes(40) || this.keysDown.includes(83)) { // Down
		this.camera.y -= 8;
	}
	if (this.keysDown.includes(39) || this.keysDown.includes(68)) { // Right
		this.camera.x += 8;
	}
	if (this.keysDown.includes(37) || this.keysDown.includes(65)) { // Left
		this.camera.x -= 8;
	}
	this.updateCamera();
}.bind(Spooks);

window.addEventListener("load", Spooks.init);