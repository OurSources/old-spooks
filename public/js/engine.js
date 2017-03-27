/*global Image*/
var Spooks = Spooks || {};

Spooks.camera = {
	x: 0,
	y: 0,
	zoom: 1
};

Spooks.updateCamera = function() {
	var xStart = Math.floor( this.camera.x / this.options.tileSize / this.options.chunkSize),
	    yStart = Math.floor(-this.camera.y / this.options.tileSize / this.options.chunkSize),
	    xEnd   = Math.ceil(( this.camera.x + document.getElementById("world").getBoundingClientRect().width  / this.camera.zoom) / this.options.tileSize / this.options.chunkSize),
	    yEnd   = Math.ceil((-this.camera.y + document.getElementById("world").getBoundingClientRect().height / this.camera.zoom) / this.options.tileSize / this.options.chunkSize);
	
	// Delete chunks that are outside of view
	for (var i in this.chunks) {
		if (
			this.chunks[i].x < xStart ||
			this.chunks[i].y < yStart ||
			this.chunks[i].y > yEnd   ||
			this.chunks[i].x > xEnd
		) this.chunks[i].delete();
	}
	
	if (this.net.connected && this.net.stage == this.net.stages.play) {
	    // Request new chunks in view
	    var newChunks = [];
	    for (var y = yStart; y < yEnd; y++) {
			for (var x = xStart; x < xEnd; x++) {
			    if (!([x, y] in this.chunks)) {
				    new Spooks.Chunk(x, y);
				    newChunks.push(x + "," + y);
				}
			}
		}
		if (newChunks.length) this.net.requestChunks(newChunks);
	}
	
	if (this.options.renderMode == "chunkCanvas") {
		document.getElementById("world").style.transform = // Translate is faster than top and bottom /*"translate(50%, 50%)*/
		    "translate(" + -this.camera.x + "px, " + this.camera.y + "px)";
		document.getElementById("world").style.zoom = this.camera.zoom * 100 + "%";
	}
}.bind(Spooks);

Spooks.tilesets = [];

Spooks.Tileset = function(id, callback) {
	this.id = id;
	this.width = 0;
	
	this.loaded = false;
	this.callbacks = callback ? [callback] : [];
	
	this.img = new Image();
	this.img.onload = function onload() {
		this.width = this.img.width / Spooks.options.tileSize;
		for (var i = 0; i < this.callbacks.length; i++) {
			this.callbacks[i]();
		}
		this.loaded = true;
	}.bind(this);
	this.img.src = "assets/tilesets/" + id + ".png";
	
	Spooks.tilesets[id] = this;
};

Spooks.Tileset.prototype.delete = function() {
	delete Spooks.tilesets[this.id];
};

Spooks.chunks = {};

Spooks.Chunk = function(Xpos, Ypos) {
	if (this.constructor != Spooks.Chunk) {
		throw new Error('Spooks.Chunk is a constructor and needs to be invoked via "new".');
	}
	
	if ([Xpos, Ypos] in Spooks.chunks) {
		// Delete chunk if it already exists
		Spooks.chunks[[Xpos, Ypos]].delete();
	}
	
	this.x = Xpos;
	this.y = Ypos;
	this.chunkData = {
		tilesets: [],
		tiles: new Array(Math.pow(Spooks.options.chunkSize, 2)).fill(0)
	};
	
	Spooks.chunks[[Xpos, Ypos]] = this;
};

Spooks.Chunk.prototype.setData = function(chunkData) {
	var chunkSize = Spooks.options.chunkSize,
	    tileSize  = Spooks.options.tileSize;
	this.chunkData = chunkData;
	this.canvas = document.createElement("canvas");
	this.canvas.width  = tileSize * chunkSize;
	this.canvas.height = tileSize * chunkSize;
	if (Spooks.options.renderMode == "chunkCanvas") {
		this.canvas.style.transform = "translate(" + // Translate is faster than top and bottom
			this.x * tileSize * chunkSize + "px, " +
			this.y * tileSize * chunkSize + "px)";
		document.getElementById("chunks").appendChild(this.canvas);
	}
	
	// Load all tilesets
	for (var i = 0; i < chunkData.tilesets.length; i++) {
	    if (!(chunkData.tilesets[i] in Spooks.tilesets)) {
			new Spooks.Tileset(chunkData.tilesets[i], this.renderChunk.bind(this));
		} else if (!Spooks.tilesets[chunkData.tilesets[i]].loaded) {
			Spooks.tilesets[chunkData.tilesets[i]].callbacks.push(this.renderChunk.bind(this));
		} else this.renderChunk();
	}
};

Spooks.Chunk.prototype.renderChunk = function() {
	var chunkSize = Spooks.options.chunkSize,
	    tileSize = Spooks.options.tileSize,
	    context = this.canvas.getContext("2d");
	for (var y = 0; y < chunkSize; y++) {
		for (var x = 0; x < chunkSize; x++) {
			var id = this.chunkData.tiles[y * chunkSize + x],
			    tileset = Spooks.tilesets[Math.floor(id / Spooks.options.tilesetSize)],
			    index = id % Spooks.options.tilesetSize; // Tile index in tileset
			context.drawImage(
				tileset.img,
				tileSize *           (index % tileset.width),
				tileSize * Math.floor(index / tileset.width),
				tileSize,
				tileSize,
				tileSize * x,
				tileSize * y,
				tileSize,
				tileSize
			);
		}
	}
};

Spooks.Chunk.prototype.delete = function() {
	if (Spooks.options.renderMode == "chunkCanvas") {
		if (this.canvas) this.canvas.parentNode.removeChild(this.canvas);
	}
	
	delete Spooks.chunks[[this.x, this.y]];
};

Spooks.render = function() {
	var ctx = this.tileCanvas.getContext("2d");
	ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
	for (var i in this.chunks) {
		if (this.chunks[i].canvas) {
			ctx.drawImage(
				this.chunks[i].canvas,
				(this.chunks[i].x * this.options.tileSize * this.options.chunkSize - this.camera.x) * this.camera.zoom,
				(this.chunks[i].y * this.options.tileSize * this.options.chunkSize + this.camera.y) * this.camera.zoom,
				this.options.tileSize * this.options.chunkSize * this.camera.zoom,
				this.options.tileSize * this.options.chunkSize * this.camera.zoom
			);
		}
	}
	
	window.requestAnimationFrame(this.render);
}.bind(Spooks);