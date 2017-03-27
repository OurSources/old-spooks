var Spooks = Spooks || {};

window.onload = function onload() {
	window.addEventListener("mousemove", function(event) {
		
	});
	
	var Window = this.ui.Window;//looks better

	new Window(100,   0, 400, 200, "Test Window 1", document.createElement("div"), true, 50, 50);
	new Window(200, 200, 400, 200, "Test Window 2", document.createElement("div"), true, 50, 50);
	new Window(300, 400, 400, 200, "Test Window 3", document.createElement("div"), true, 50, 50);
}.bind(Spooks);