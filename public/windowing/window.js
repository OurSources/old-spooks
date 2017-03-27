var Spooks = Spooks || {};

Spooks.ui = Spooks.ui || {};

Spooks.ui.windows = [];

Spooks.ui.activeWindow = -1;

Spooks.ui.Window = function Window(x, y, w, h, title, content, resizable, minX, minY) {
	this.x = x || 0;
	this.y = y || 0;
	this.width = w || 300;
	this.height = h || 300;
	this.content = content;
	this.resizable = resizable || true;
	this.minX = minX || 150;
	this.minY = minY || 50;
	
	this.id = Spooks.ui.windows.push(this) - 1;
	
	var element = this.element = document.createElement("div");
	
	element.style.top = y + "px";
	element.style.left = x + "px";
	element.style.width = this.width + "px";
	element.style.height = this.height + "px";
	element.onclick = function(event) {
		event.stopPropagation();
		this.select();
	}.bind(this);
	
	if (resizable) {
		var dirs = ["nw", "sw", "se", "ne", "n", "w", "s", "e"], i = dirs.length;
		while(i--) {
			var resizer = document.createElement("div");
			resizer.className = "resize-" + dirs[i];
			switch(dirs[i]) {
				case "n": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-n";
							Spooks.ui.dragOffset = [
								event.pageY - document.getElementById("windows").getBoundingClientRect().top, // Drag offset y
								event.pageY + this.height // Original height
							];
						}
					}.bind(this));
					break;
				}
				case "w": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-w";
							Spooks.ui.dragOffset = [
								event.pageX - document.getElementById("windows").getBoundingClientRect().left, // Draf offset x
								event.pageX + this.width // Original width
							];
						}
					}.bind(this));
					break;
				}
				case "s": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-s";
							Spooks.ui.dragOffset = [
								event.pageY - this.height // Drag offset y
							];
						}
					}.bind(this));
					break;
				}
				case "e": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-e";
							Spooks.ui.dragOffset = [
								event.pageX - this.width // Drag offset x
							];
						}
					}.bind(this));
					break;
				}
				case "nw": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-nw";
							Spooks.ui.dragOffset = [
								event.pageX - document.getElementById("windows").getBoundingClientRect().left, // Drag offset x
								event.pageY - document.getElementById("windows").getBoundingClientRect().top, // Drag offset y
								event.pageX + this.width, // Original width
								event.pageY + this.height // Original height
							];
						}
					}.bind(this));
					break;
				}
				case "sw": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-sw";
							Spooks.ui.dragOffset = [
								event.pageX - document.getElementById("windows").getBoundingClientRect().left, // Drag offset x
								event.pageY - this.height, // Drag offset y
								event.pageX + this.width // Original width
							];
						}
					}.bind(this));
					break;
				}
				case "se": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-se";
							Spooks.ui.dragOffset = [
								event.pageX - this.width, // Drag offset x
								event.pageY - this.height // Drag offset y
							];
						}
					}.bind(this));
					break;
				}
				case "ne": {
					resizer.addEventListener("mousedown", function(event) {
						if (event.button === 0) {
							Spooks.ui.dragging = "resize-ne";
							Spooks.ui.dragOffset = [
								event.pageX - this.width, // Drag offset x
								event.pageY - document.getElementById("windows").getBoundingClientRect().top, // Drag offset y
								event.pageY + this.height // Original height
							];
						}
					}.bind(this));
					break;
				}
			}
			element.appendChild(resizer);
		}
	}
	
	var titleBar = document.createElement("div");
	titleBar.className = "title-bar";
	var titleElement = document.createElement("span");
	titleElement.innerHTML = title;
	titleBar.appendChild(titleElement);
	titleBar.onmousedown = function(event) {
		if (event.button === 0) {
			Spooks.ui.dragging = "window";
			//dragOffsetX = event.pageX - this.getBoundingClientRect().left + 6;
			//dragOffsetY = event.pageY - this.getBoundingClientRect().top + 6;
		}
	};
	element.appendChild(titleBar);
	
	var contentElement = document.createElement("div");
	contentElement.className = "content";
	contentElement.appendChild(content);
	element.appendChild(contentElement);
	
	this.element = element;
	
	document.getElementById("windows").appendChild(this.element);
	
	this.select();
};

Spooks.ui.Window.prototype.select = function select() {
	Spooks.ui.selectWindow(this.id);
};

Spooks.ui.Window.prototype.destroy = function destroy() {
	document.getElementById("windows").removeChild(this.element);
	delete Spooks.ui.windows[this.id];
};

Spooks.ui.selectWindow = function selectWindow(id) {
	this.activeWindow = id;
	if (id != -1) {
		this.windows.unshift(this.windows.splice(id, 1)[0]);
	}
	var i = this.windows.length;
	while (i--) {
		var uiWindow = this.windows[i];
		uiWindow.element.style.zIndex = this.windows.length - i;
		uiWindow.element.className = "window" + (uiWindow.resizable ? " resizable" : "");
		this.windows[i].id = i;
	}
	if (id != -1) {
		this.windows[0].element.className = "window" + (this.windows[0].resizable ? " resizable" : "") + " selected";
	}
}.bind(Spooks.ui);