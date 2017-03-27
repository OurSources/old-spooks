var Spooks = Spooks ||{};

Spooks.ui = {};

Spooks.selectedTileset = -1;
Spooks.tilesetsOpen = [];

Spooks.tilesetSelection = {
	width: 0,
	height: 0,
	tiles: [],
	tilesets: []
};
Spooks.placeRandom = false;
Spooks.tileDisplayElements = [];
Spooks.history = [];

Spooks.lastPlace = [null, null];

Spooks.resize = function() {
	this.tileCanvas.width = document.getElementById("world").clientWidth;
	this.tileCanvas.height = document.getElementById("world").clientHeight;
}.bind(Spooks);

Spooks.selectTileset = function(id) {
	this.selectedTileset = id;
	if (id == -1) {
		document.getElementById("tile-display").innerHTML = "";
	} else {
		for (var i=0; i<document.getElementById("tilesets-list").children.length; i++) {
			document.getElementById("tilesets-list").children[i].className = "";
		}
		document.getElementById("tileset-tab-" + id).className = "selected";
		
		document.getElementById("tile-display").innerHTML = "";
		this.tileDisplayElements = [];
		if (!Spooks.tilesets[id].dataLoaded) {
			Spooks.tilesets[id].dataCallbacks.push(function() {dataLoaded(id)});
		} else {
			dataLoaded(id);
		}
		function dataLoaded(id) {
			for (var y=0; y<Spooks.tilesets[id].height; y++) {
				for (var x=0; x<Spooks.tilesets[id].width; x++) {
					var tile = document.createElement("div");
					tile.style.background = "url(\"../assets/tilesets/" + id + ".png\") " + (-x * Spooks.options.tileSize) + "px " + (-y * Spooks.options.tileSize) + "px";
					Spooks.tileDisplayElements.push(tile);
					document.getElementById("tile-display").appendChild(tile);
				}
				document.getElementById("tile-display").appendChild(document.createElement("br"));
			}
		}
	}
}.bind(Spooks);

Spooks.setTilesetZoom = function(zoom) {
	document.styleSheets[0].rules[0].style.zoom = 100 * zoom + "%";
	document.styleSheets[0].rules[0].style.margin = "0 " + 1 / zoom + "px " + 1 / zoom + "px 0";
};

Spooks.updateTilesetSelection = function(selection) {
	// Check if new selection is identical to previous
	var isEqual = true;
	if (selection.tiles.length == this.tilesetSelection.tiles.length) {
		for (var i=selection.tiles.length; i--;) {
			console.log();
			if (selection.tiles[i] !== this.tilesetSelection.tiles[i] || selection.tilesets[i] !== this.tilesetSelection.tilesets[i]) {
				isEqual = false;
				break;
			}
		}
	} else {
		isEqual = false;
	}
	if (!isEqual) {
		for (var i=0; i<this.tilesetSelection.tiles.length; i++) {
			if (this.tilesetSelection.tilesets[i] == this.selectedTileset) {
				this.tileDisplayElements[this.tilesetSelection.tiles[i]].className = "";
			}
		}
		this.tilesetSelection = selection;
		for (var j=0; j<this.tilesetSelection.tiles.length; j++) {
			if (this.tilesetSelection.tilesets[j] == this.selectedTileset) {
				this.tileDisplayElements[this.tilesetSelection.tiles[j]].className = "selected";
			}
		}
		
		this.renderTilesetSelection(selection);
	}
}.bind(Spooks);

Spooks.renderTilesetSelection = function(selection) {
	// Draw selection to the place canvas
	var ctx = this.placeCanvas.getContext("2d");
	if (this.placeRandom) {
		this.placeCanvas.width = this.options.tileSize;
		this.placeCanvas.height = this.options.tileSize;
		var tile = selection.tiles[Math.floor(Math.random() * selection.tiles.length)];
		ctx.drawImage(
			this.tilesets[this.selectedTileset].img,
			(tile % this.tilesets[this.selectedTileset].width) * this.options.tileSize,
			Math.floor(tile / this.tilesets[this.selectedTileset].width) * this.options.tileSize,
			this.options.tileSize,
			this.options.tileSize,
			0,
			0,
			this.options.tileSize,
			this.options.tileSize
		);
	} else {
		this.placeCanvas.width = selection.width * this.options.tileSize;
		this.placeCanvas.height = selection.height * this.options.tileSize;
		for (var y=0; y<selection.height; y++) {
			for (var x=0; x<selection.width; x++) {
				var tile = selection.tiles[y * selection.width + x];
				ctx.drawImage(
					this.tilesets[this.selectedTileset].img,
					(tile % this.tilesets[this.selectedTileset].width) * this.options.tileSize,
					Math.floor(tile / this.tilesets[this.selectedTileset].width) * this.options.tileSize,
					this.options.tileSize,
					this.options.tileSize,
					x * this.options.tileSize,
					y * this.options.tileSize,
					this.options.tileSize,
					this.options.tileSize
				);
			}
		}
	}
}.bind(Spooks);

Spooks.updateTilesetSelector = function() {
	document.getElementById("tileset-selector-list").innerHTML = "";
	function addTileset(id, name) {
		return function() {
			if (!Spooks.tilesetsOpen.includes(id)) {
				Spooks.tilesetsOpen.push(id);
				if (!(id in Spooks.tilesets)) {
					new Spooks.Tileset(id);
				}
				var tilesetTab = document.createElement("li");
				tilesetTab.id = "tileset-tab-" + id;
				tilesetTab.innerHTML = name;
				tilesetTab.addEventListener("click", function() {
					Spooks.selectTileset(id);
				});
				document.getElementById("tilesets-list").appendChild(tilesetTab);
				document.getElementById("tileset-selector").style.display = "none";
				Spooks.selectTileset(id);
				document.getElementById("remove-tileset").disabled = false;
			}
		};
	}
	function addElement(id) {
		var xhttp = new XMLHttpRequest;
			xhttp.open("GET", "../assets/tilesets/" + id + ".json", true);
			xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				var data = JSON.parse(xhttp.responseText);
				var element = document.createElement("li");
				var title = document.createElement("span");
				title.innerHTML = data.name;
				title.className = "title";
				element.appendChild(title);
				var img = document.createElement("img");
				img.src = "../assets/tilesets/" + id + ".png";
				element.appendChild(img);
				element.addEventListener("click", addTileset(id, data.name));
				document.getElementById("tileset-selector-list").appendChild(element);
				if (id < 11) {
					addElement(id + 1);
				}
			}
		}.bind(this);
		xhttp.send();
	}
	addElement(0);
}.bind(Spooks);

Spooks.dragging = false;
Spooks.dragOffset = [0, 0];

Spooks.toolSelected = "stamp";
Spooks.lastTool = "stamp";

Spooks.selectTool = function(tool) {
	var children = document.getElementById("toolbar").children;
	for (var i=0; i<children.length; i++) {
		children[i].className = "";
	}
	document.getElementById("tool-" + tool).className = "selected";
	this.toolSelected = tool;
	switch(tool) {
		case "stamp":
			this.renderTilesetSelection(this.tilesetSelection);
			break;
		case "pan":
			this.placeCanvas.width = 0;
			this.placeCanvas.height = 0;
			break;
		case "eraser":
			this.placeCanvas.width = this.options.tileSize;
			this.placeCanvas.height = this.options.tileSize;
			break;
	}
}.bind(Spooks);

Spooks.layout = ["left", ["top", "tilesets", "explorer"]];

Spooks.modules = {};
Spooks.modules.viewport = {
	
};
Spooks.modules.tilesets = {
	
};

Spooks.ui.renderModules = function() {
	
};

Spooks.ui.init = function() {
	// Keybinds
	window.addEventListener("keypress", function(event) {
		if (event.ctrlKey && event.which == 26 && Spooks.history.length) {
			var selection = Spooks.history.pop();
			Spooks.placeSelection(selection[0], selection[1], {width: selection[2], height: selection[3], tiles: selection[4], tilesets: selection[5]});
		}
	});
	
	// Menu bar
	for (var j=0; j<this.options.menuBar.length; j++) {
		var element = document.createElement("li");
		var title = document.createElement("span");
		title.innerHTML = this.options.menuBar[j].title;
		element.appendChild(title);
		var children = document.createElement("ol");
		for (var k=0; k<this.options.menuBar[j].children.length; k++) {
			var child = document.createElement("li");
			if (this.options.menuBar[j].children[k] == "separator") {
				child.className = "separator";
			} else {
				var childTitle = document.createElement("span");
				childTitle.innerHTML = this.options.menuBar[j].children[k].title;
				child.appendChild(childTitle);
				child.addEventListener("click", this.options.menuBar[j].children[k].use);
			}
			children.appendChild(child);
		}
		element.appendChild(children);
		element.addEventListener("click", function() {
			this.classList.toggle("active");
		});
		document.getElementById("menubar").appendChild(element);
	}
	window.addEventListener("click", function(event) {
		var children = document.getElementById("menubar").children;
		for (var i=0; i<children.length; i++) {
			if (event.target.parentElement != children[i]) {
				children[i].className = "";
			}
		}
	});
	
	// Toolbar
	function selectTool(tool) {
		return function() {
			Spooks.selectTool(tool);
		};
	}
	["stamp", "pan", "terrain", "fill", "eraser", "select", "magic", "same"].forEach(function(tool) {
		document.getElementById("tool-" + tool).addEventListener("click", selectTool(tool));
	});
	
	// Add zoom values
	for (var i=0; i<this.options.zoomValues.length; i++) {
		var option = document.createElement("option");
		option.innerHTML = this.options.zoomValues[i] * 100 + "%";
		option.value = this.options.zoomValues[i];
		document.getElementById("map-zoom").appendChild(option);
	}
	document.getElementById("map-zoom").value = 1;
	document.getElementById("map-zoom").addEventListener("change", function() {
		Spooks.camera.zoom = parseFloat(this.value);
		Spooks.placeCanvas.style.zoom = Spooks.camera.zoom * 100 + "%";
		Spooks.updateCamera();
	});
	
	// Menu resize
	document.getElementById("menu-resize").addEventListener("mousedown", function(event) {
		if (event.button === 0) {
			Spooks.dragging = "menu";
			Spooks.dragOffset = [event.pageX - this.getBoundingClientRect().left, 0];
		}
	});
	
	this.placeCanvas = document.createElement("canvas");
	this.placeCanvas.width = 0;
	this.placeCanvas.height = 0;
	this.placeCanvas.id = "placeCanvas";
	document.getElementById("world").appendChild(this.placeCanvas);
	window.addEventListener("mousemove", function(event) {
		this.placeCanvas.style.top  = Math.floor(((event.pageY - document.getElementById("world").getBoundingClientRect().top ) / this.camera.zoom + this.camera.y) / this.options.tileSize) * this.options.tileSize - this.camera.y + "px";
		this.placeCanvas.style.left = Math.floor(((event.pageX - document.getElementById("world").getBoundingClientRect().left) / this.camera.zoom + this.camera.x) / this.options.tileSize) * this.options.tileSize - this.camera.x + "px";
		if (event.buttons % 2) {
			switch (this.dragging) {
				case "menu":
					document.getElementById("menu").style.width = Math.max(Math.min(event.pageX - this.dragOffset[0], window.innerWidth - 150), 150) + "px";
					this.resize();
					break;
				case "tile-display":
					if (this.selectedTileset != -1) {
						var bounds = [
							Math.min(Math.max(event.clientX - document.getElementById("tile-display").getBoundingClientRect().left + document.getElementById("tile-display").scrollLeft, 0), this.dragOffset[0]),
							Math.min(Math.max(event.clientY - document.getElementById("tile-display").getBoundingClientRect().top + document.getElementById("tile-display").scrollTop, 0), this.dragOffset[1]),
							Math.min(
								Math.max(Math.min(event.clientX - document.getElementById("tile-display").getBoundingClientRect().left + document.getElementById("tile-display").scrollLeft,document.getElementById("tile-display").scrollWidth), this.dragOffset[0]),
								this.tilesets[this.selectedTileset].width * (this.options.tileSize + 1)
							),
							Math.min(
								Math.max(Math.min(event.clientY - document.getElementById("tile-display").getBoundingClientRect().top + document.getElementById("tile-display").scrollTop, document.getElementById("tile-display").scrollHeight - 3), this.dragOffset[1]),
								this.tilesets[this.selectedTileset].height * (this.options.tileSize + 1)
							)
						];
						var size = parseFloat(document.getElementById("tile-display-zoom").value) * this.options.tileSize + 1;
						var selected = {
							width:  Math.max(Math.ceil(bounds[2] / size) - Math.floor(bounds[0] / size), 1),
							height: Math.max(Math.ceil(bounds[3] / size) - Math.floor(bounds[1] / size), 1),
							tiles: []
						};
						selected.tilesets = new Array(selected.width * selected.height).fill(this.selectedTileset);
						for (var y=Math.floor(bounds[1] / size); y<Math.ceil(bounds[3] / size); y++) {
							for (var x=Math.floor(bounds[0] / size); x<Math.ceil(bounds[2] / size); x++) {
								selected.tiles.push(y * this.tilesets[this.selectedTileset].width + x);
								selected.tilesets.push();
							}
						}
						this.updateTilesetSelection(selected);
					}
					break;
				case "map":
					if (this.toolSelected == "stamp") {
						var x = Math.floor(((event.pageX - document.getElementById("world").getBoundingClientRect().left) / this.camera.zoom + this.camera.x) / this.options.tileSize);
						var y = Math.floor(((event.pageY - document.getElementById("world").getBoundingClientRect().top ) / this.camera.zoom + this.camera.y) / this.options.tileSize);
						if (x != this.lastPlace[0] || y != this.lastPlace[1]) {
							this.lastPlace = [x, y];
							this.placeSelection(x, y, this.tilesetSelection, true);
						}
					} else if (this.toolSelected == "pan") {
						this.camera.x = this.dragOffset[0] - event.clientX / this.camera.zoom;
						this.camera.y = this.dragOffset[1] - event.clientY / this.camera.zoom;
					} else if (this.toolSelected == "eraser") {
						var x = Math.floor(((event.pageX - document.getElementById("world").getBoundingClientRect().left) / this.camera.zoom + this.camera.x) / this.options.tileSize);
						var y = Math.floor(((event.pageY - document.getElementById("world").getBoundingClientRect().top ) / this.camera.zoom + this.camera.y) / this.options.tileSize);
						if (x != this.lastPlace[0] || y != this.lastPlace[1]) {
							this.lastPlace = [x, y];
							this.placeSelection(x, y, {width: 1, height: 1, tiles: [-1], tilesets: [-1]}, true);
						}
					}
					break;
			}
		} else if ((event.buttons & 4) == 4) {
			this.camera.x = this.dragOffset[0] - event.clientX / this.camera.zoom;
			this.camera.y = this.dragOffset[1] - event.clientY / this.camera.zoom;
		} else {
			this.dragging = false;
		}
	}.bind(this));
	
	// Fix tileset select height
	var scrollDiv = document.createElement("div");
	scrollDiv.style.width = "100px";
	scrollDiv.style.height = "100px";
	scrollDiv.style.overflow = "scroll";
	document.body.appendChild(scrollDiv);
	
	var scrollbarHeight = scrollDiv.offsetHeight - scrollDiv.clientHeight;
	
	document.body.removeChild(scrollDiv);
	document.getElementById("tilesets").style.height = 24 + scrollbarHeight + "px";
	
	// Tileset selector
	document.getElementById("add-tileset").addEventListener("click", function() {
		document.getElementById("tileset-selector").style.display = "";
		Spooks.updateTilesetSelector();
	});
	document.getElementById("remove-tileset").addEventListener("click", function() {
		var index = this.tilesetsOpen.indexOf(this.selectedTileset);
	    this.tilesetsOpen.splice(this.tilesetsOpen.indexOf(this.selectedTileset), 1);
	    document.getElementById("tilesets-list").removeChild(document.getElementById("tileset-tab-" + Spooks.selectedTileset));
	    this.selectTileset(this.tilesetsOpen[Math.min(index, this.tilesetsOpen.length - 1)] || -1);
	    if (this.selectedTileset == -1) {
	    	document.getElementById("remove-tileset").disabled = true;
	    }
	}.bind(this));
	
	// Tileset display zoom
	for (var i=0; i<this.options.zoomValues.length; i++) {
		/*var*/ option = document.createElement("option");
		option.innerHTML = this.options.zoomValues[i] * 100 + "%";
		option.value = this.options.zoomValues[i];
		document.getElementById("tile-display-zoom").appendChild(option);
	}
	document.getElementById("tile-display-zoom").value = 1;
	document.getElementById("tile-display-zoom").addEventListener("change", function() {
		Spooks.setTilesetZoom(parseFloat(this.value));
	});
	
	document.getElementById("tile-display").addEventListener("mousedown", function(event) {
		// Don't detect click on scrollbar
		if (
			Spooks.selectedTileset != -1 &&
			event.clientX < this.getBoundingClientRect().left + parseFloat(window.getComputedStyle(this).width) &&
			event.clientY < this.getBoundingClientRect().top + parseFloat(window.getComputedStyle(this).height) &&
			event.clientX < this.getBoundingClientRect().left + Spooks.tilesets[Spooks.selectedTileset].width * (Spooks.options.tileSize + 1) &&
			event.clientY < this.getBoundingClientRect().top + Spooks.tilesets[Spooks.selectedTileset].height * (Spooks.options.tileSize + 1)
		) {
			Spooks.dragging = "tile-display";
			Spooks.dragOffset = [event.clientX - this.getBoundingClientRect().left + document.getElementById("tile-display").scrollLeft, event.clientY - this.getBoundingClientRect().top + document.getElementById("tile-display").scrollTop];
			Spooks.selectTool("stamp");
			Spooks.updateTilesetSelection({width: 1, height: 1, tiles: [
				Math.floor(Spooks.dragOffset[1] / (parseFloat(document.getElementById("tile-display-zoom").value) * Spooks.options.tileSize + 1)) *
				Spooks.tilesets[Spooks.selectedTileset].width +
				Math.floor(Spooks.dragOffset[0] / (parseFloat(document.getElementById("tile-display-zoom").value) * Spooks.options.tileSize + 1))
			], tilesets: [Spooks.selectedTileset]});
		}
	});
	
	// Tile placement
	document.getElementById("viewport").addEventListener("mousedown", function(event) {
		// Don't detect click on scrollbar
		if (event.clientX < this.getBoundingClientRect().left + parseFloat(window.getComputedStyle(this).width) && event.clientY < this.getBoundingClientRect().top + parseFloat(window.getComputedStyle(this).height)) {
			Spooks.dragging = "map";
			if (event.button === 0) {
				if (Spooks.toolSelected == "stamp") {
					var x = Math.floor(((event.pageX - this.getBoundingClientRect().left) / Spooks.camera.zoom + Spooks.camera.x) / Spooks.options.tileSize);
					var y = Math.floor(((event.pageY - this.getBoundingClientRect().top ) / Spooks.camera.zoom + Spooks.camera.y) / Spooks.options.tileSize);
					if (x != Spooks.lastPlace[0] || y != Spooks.lastPlace[1]) {
						Spooks.lastPlace = [x, y];
						Spooks.placeSelection(x, y, Spooks.tilesetSelection, true);
					}
				} else if (Spooks.toolSelected == "pan") {
					Spooks.dragOffset = [Spooks.camera.x + event.clientX / Spooks.camera.zoom, Spooks.camera.y + event.clientY / Spooks.camera.zoom];
				}
			} else if (event.button == 1) {
				Spooks.dragOffset = [Spooks.camera.x + event.clientX / Spooks.camera.zoom, Spooks.camera.y + event.clientY / Spooks.camera.zoom];
			}
		}
	});
	
	// Status bar
	document.getElementById("random-mode").addEventListener("click", function() {
		Spooks.placeRandom = this.checked;
		Spooks.renderTilesetSelection(Spooks.tilesetSelection);
	});
}.bind(Spooks);