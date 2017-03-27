/*global Image*/
var Spooks = Spooks || {};

Spooks.camera = {
	x: 0,
	y: 0,
	zoom: 1
};

Spooks.updateCamera = function() {
	document.getElementById("grid-pattern").setAttribute("patternTransform", "translate(" + -this.camera.x * this.camera.zoom + ", " + -this.camera.y * this.camera.zoom + ")");
	document.getElementById("grid-pattern").width.baseVal.value = 16 * this.camera.zoom;
	document.getElementById("grid-pattern").height.baseVal.value = 16 * this.camera.zoom;
	document.getElementById("grid-path").setAttribute("d", "M " + 16 * this.camera.zoom + " 0 L 0 0 0 " + 16 * this.camera.zoom);
}.bind(Spooks);

Spooks.tilesets = [];

Spooks.Tileset = function(id, imgCallback, dataCallback) {
	this.id = id;
	this.width = 0;
	
	this.imgLoaded = false;
	this.imgCallbacks = imgCallback ? [imgCallback] : [];
	this.dataLoaded = false;
	this.dataCallbacks = dataCallback ? [dataCallback] : [];
	
	this.img = new Image();
	this.img.onload = function() {
		this.imgLoaded = true;
		this.width = this.img.width / Spooks.options.tileSize;
		for (var i=0; i<this.imgCallbacks.length; i++) {
			this.imgCallbacks[i](id);
		}
	}.bind(this);
	this.img.src = "../assets/tilesets/" + id + ".png";
	
	var xhttp = new XMLHttpRequest;
		xhttp.open("GET", "../assets/tilesets/" + id + ".json", true);
		xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var data = JSON.parse(xhttp.responseText);
			this.name = data.name;
			this.width = data.width;
			this.height = data.height;
			for (var i=0; i<this.dataCallbacks.length; i++) {
				this.dataCallbacks[i](id);
			}
			this.dataLoaded = true;
		}
	}.bind(this);
	xhttp.send();
	
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
	this.chunkData = chunkData;
	
	
	this.canvas = document.createElement("canvas");
	this.canvas.width = Spooks.options.tileSize * Spooks.options.chunkSize;
	this.canvas.height = Spooks.options.tileSize * Spooks.options.chunkSize;
	
	// Load all tilesets
	for (var i=0; i<chunkData.tilesets.length; i++) {
		if (!(chunkData.tilesets[i] in Spooks.tilesets)) {
			new Spooks.Tileset(chunkData.tilesets[i], this.renderChunk.bind(this));
		} else if (!Spooks.tilesets[chunkData.tilesets[i]].imgLoaded) {
			Spooks.tilesets[chunkData.tilesets[i]].imgCallbacks.push(this.renderChunk.bind(this));
		} else {
			this.renderChunk();
		}
	}
};

Spooks.Chunk.prototype.renderChunk = function() {
	var ctx = this.canvas.getContext("2d");
	ctx.clearRect(0, 0, Spooks.options.tileSize * Spooks.options.chunkSize, Spooks.options.tileSize * Spooks.options.chunkSize);
	for (var y=0; y<Spooks.options.chunkSize; y++) {
		for (var x=0; x<Spooks.options.chunkSize; x++) {
			var id = this.chunkData.tiles[y * Spooks.options.chunkSize + x];
			if (id != -1) {
				var tileset = Spooks.tilesets[this.chunkData.tilesets[Math.floor(id / Spooks.options.tilesetSize)]],
					index = id % Spooks.options.tilesetSize; // Tile index in tileset
				ctx.drawImage(
					tileset.img,
					(index % tileset.width) * Spooks.options.tileSize,
					Math.floor(index / tileset.width) * Spooks.options.tileSize,
					Spooks.options.tileSize,
					Spooks.options.tileSize,
					x * Spooks.options.tileSize,
					y * Spooks.options.tileSize,
					Spooks.options.tileSize,
					Spooks.options.tileSize
				);
			}
		}
	}
};

Spooks.Chunk.prototype.delete = function() {
	delete Spooks.chunks[[this.x, this.y]];
};

// Fixed modulo
function mod(n, m) {
	return ((n % m) + m) % m;
}

Spooks.placeSelection = function(x, y, selection, saveHistory) {
	var minChunkX = Math.floor(x / this.options.chunkSize);
	var minChunkY = Math.floor(y / this.options.chunkSize);
	var maxChunkX = Math.floor((x + selection.width) / this.options.chunkSize);
	var maxChunkY = Math.floor((y + selection.height) / this.options.chunkSize);
	if (this.placeRandom) {
		maxChunkX = minChunkX;
		maxChunkY = minChunkY;
	}
	for (var cy=minChunkY; cy<=maxChunkY; cy++) {
		for (var cx=minChunkX; cx<=maxChunkX; cx++) {
			if (!([cx, cy] in this.chunks)) {
				new this.Chunk(cx, cy).setData({tilesets: [], tiles: new Array(this.options.chunkSize * this.options.chunkSize).fill(-1)});
			}
			if (this.chunks[[cx, cy]].chunkData.tilesets.indexOf(this.selectedTileset) == -1) {
				this.chunks[[cx, cy]].chunkData.tilesets.push(this.selectedTileset);
			}
		}
	}
	
	if (this.placeRandom) {
		if (saveHistory) {
			this.history.push([x, y, 1, 1, [this.chunks[[minChunkX, minChunkY]].chunkData.tiles[
					mod(y, this.options.chunkSize) * this.options.chunkSize + mod(x, this.options.chunkSize)
				] % this.options.tilesetSize],
				[Math.floor(this.chunks[[minChunkX, minChunkY]].chunkData.tiles[
					mod(y, this.options.chunkSize) * this.options.chunkSize + mod(x, this.options.chunkSize)
				] / this.options.tilesetSize)]
			]);
		}
		var tile = Math.floor(Math.random() * selection.tiles.length);
		this.chunks[[minChunkX, minChunkY]].chunkData.tiles[
			mod(y, this.options.chunkSize) * this.options.chunkSize + mod(x, this.options.chunkSize)
		] = selection.tiles[tile] + selection.tiles[tile] == -1 ? 0 : (this.chunks[[minChunkX, minChunkY]].chunkData.tilesets.indexOf(selection.tilesets[tile]) * this.options.tilesetSize);
	} else {
		var tiles = [];
		var tilesets = [];
		for (var ty=0; ty<selection.height; ty++) {
			for (var tx=0; tx<selection.width; tx++) {
				if (selection.tiles[y * selection.width + x] != -2) {
					var cx = Math.floor((x + tx) / this.options.chunkSize),
						cy = Math.floor((y + ty) / this.options.chunkSize);
					if (saveHistory) {
						tiles.push(this.chunks[[cx, cy]].chunkData.tiles[
							mod(y + ty, this.options.chunkSize) * this.options.chunkSize + mod(x + tx, this.options.chunkSize)
						] % this.options.tilesetSize);
						tilesets.push(this.chunks[[cx, cy]].chunkData.tilesets[Math.floor(this.chunks[[cx, cy]].chunkData.tiles[
							mod(y + ty, this.options.chunkSize) * this.options.chunkSize + mod(x + tx, this.options.chunkSize)
						] / this.options.tilesetSize)] || 0);
						console.log();
					}
					this.chunks[[cx, cy]].chunkData.tiles[
						mod(y + ty, this.options.chunkSize) * this.options.chunkSize + mod(x + tx, this.options.chunkSize)
					] = selection.tiles[ty * selection.width + tx] + (selection.tiles[ty * selection.width + tx] == -1 ? 0 : this.chunks[[cx, cy]].chunkData.tilesets.indexOf(selection.tilesets[ty * selection.width + tx]) * this.options.tilesetSize);
				}
			}
		}
		if (saveHistory) {
			this.history.push([x, y, selection.width, selection.height, tiles, tilesets]);
		}
	}
	
	for (var cy=minChunkY; cy<=maxChunkY; cy++) {
		for (var cx=minChunkX; cx<=maxChunkX; cx++) {
			this.chunks[[cx, cy]].renderChunk();
		}
	}
}.bind(Spooks);

Spooks.render = function() {
	document.getElementById("grid-pattern").setAttribute("patternTransform", "translate(" + -this.camera.x * this.camera.zoom + ", " + -this.camera.y * this.camera.zoom + ")");
	document.getElementById("grid-pattern").width.baseVal.value = 16 * this.camera.zoom;
	document.getElementById("grid-pattern").height.baseVal.value = 16 * this.camera.zoom;
	document.getElementById("grid-path").setAttribute("d", "M " + 16 * this.camera.zoom + " 0 L 0 0 0 " + 16 * this.camera.zoom);
	
	var ctx = this.tileCanvas.getContext("2d");
	ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
	ctx.imageSmoothingEnabled = false;
	for (var i in this.chunks) {
		if (this.chunks[i].canvas) {
			ctx.drawImage(
				this.chunks[i].canvas,
				(this.chunks[i].x * this.options.tileSize * this.options.chunkSize - this.camera.x) * this.camera.zoom,
				(this.chunks[i].y * this.options.tileSize * this.options.chunkSize - this.camera.y) * this.camera.zoom,
				this.options.tileSize * this.options.chunkSize * this.camera.zoom,
				this.options.tileSize * this.options.chunkSize * this.camera.zoom
			);
		}
	}
	
	window.requestAnimationFrame(this.render);
}.bind(Spooks);