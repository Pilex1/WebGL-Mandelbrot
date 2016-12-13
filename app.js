var keys = {};
var shift = false, ctrl = false, alt = false;
var mx, my;

var vpressed = false;
var vtime = 0;

var deltaTime = 0;
var fps = 0;

var onLoad = function() {
   
   document.onkeypress = function(event) {
      console.log("a");
   }

	document.onkeydown = function(event) {
		keys[String.fromCharCode(event.keyCode).toLowerCase()] = true;
		shift = event.shiftKey;
		ctrl = event.ctrlKey;
		alt = event.altKey;
	}
	document.onkeyup = function(event) {
		keys[String.fromCharCode(event.keyCode).toLowerCase()] = false;
		shift = event.shiftKey;
		ctrl = event.ctrlKey;
		alt = event.altKey;
	}
	document.onmousemove = function(event) {
		mx = event.x;
		my = event.y;
	}

	initRenderer();

	var countTime = 0;
	var prevTime = 0;
	var mainLoop = function() {

		var curTime = performance.now();
		deltaTime = curTime - prevTime;
		countTime += deltaTime;
		if (countTime > 1000) {
			countTime -= 1000;
			fps = Math.floor(1000 / deltaTime);
		}
		prevTime = curTime;
		
		vtime += deltaTime;

		update();
		render();

		requestAnimationFrame(mainLoop);
	}
	requestAnimationFrame(mainLoop);
}
