var cv;
var gl;

var mandText, juliaText, fpsText;

var mandRenderer, juliaRenderer;

class Renderer {

	constructor(renderTarget) {

		if (renderTarget !== "mandelbrot" && renderTarget !== "julia") throw new Error("Incorrect render target: " + renderTarget);

		this.renderTarget = renderTarget;

		if (renderTarget === "mandelbrot") this.text = mandText;
		else if (renderTarget === "julia") this.text = juliaText;

		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		if (renderTarget === "mandelbrot") {
			gl.shaderSource(vertexShader, mandvsText);
			gl.shaderSource(fragmentShader, mandfsText);
		} else if (renderTarget === "julia") {
			gl.shaderSource(vertexShader, juliavsText);
			gl.shaderSource(fragmentShader, juliafsText);
		}
		
		gl.compileShader(vertexShader);
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			console.error("Error compiling " + renderTarget + " vertex shader");
			console.error(gl.getShaderInfoLog(vertexShader));
		}

		gl.compileShader(fragmentShader);
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			console.error("Error compiling " + renderTarget + " fragment shader");
			console.error(gl.getShaderInfoLog(fragmentShader));
		}

		this.program = gl.createProgram();
		gl.attachShader(this.program, vertexShader);
		gl.attachShader(this.program, fragmentShader);
		gl.linkProgram(this.program);
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			console.error("Error linking program");
			console.error(gl.getProgramInfoLog(program));
		}
		gl.validateProgram(this.program);
		if (!gl.getProgramParameter(this.program, gl.VALIDATE_STATUS)) {
			console.error("Error validating program");
			console.error(gl.getProgramInfoLog(program));
		}

		this.pos = vec2.create();
		this.posUniformLocation = gl.getUniformLocation(this.program, "pos");

		this.zoom = 2;
		this.zoomUniformLocatiom = gl.getUniformLocation(this.program, "zoom");

		this.rot = 0;
		this.rotUniformLocation = gl.getUniformLocation(this.program, "rot");

		this.maxIter = 200;
		this.maxIterUniformLocation = gl.getUniformLocation(this.program, "maxIter");

		this.clrRatio = vec3.fromValues(0.084140, 0.046273, 0.089148);
		this.clrRatioUniformLocation = gl.getUniformLocation(this.program, "clrRatio");

		this.aspectRatioUniformLocation = gl.getUniformLocation(this.program, "aspectRatio");

		this.mode = 1;
		this.modeUniformLocation = gl.getUniformLocation(this.program, "mode");
		
		this.innerMode = 1;
		this.innerModeUniformLocation = gl.getUniformLocation(this.program, "innerMode");

		this.renderVar = 2;
		this.renderVarUniformLocation = gl.getUniformLocation(this.program, "var1");

		this.cursor = 0;
		this.cursorUniformLocation = gl.getUniformLocation(this.program, "cursor");

		if (renderTarget === "julia") {
			this.vcUniformLocation = gl.getUniformLocation(this.program, "vc");
		}

		if (renderTarget === "mandelbrot") {
			this.vertices =
			new Float32Array([
			-1, 1,
			-1, -1,
			0, -1,
			0, 1
			]);
		} else if (renderTarget === "julia") {
			this.vertices =
			new Float32Array([
			0, 1,
			0, -1,
			1, -1,
			1, 1
			]);
		}

		this.verticesVBO = gl.createBuffer();
		this.vertexAttribLocation = gl.getAttribLocation(this.program, "vpos");

		this.elements =
		new Uint16Array([
		0, 1, 2,
		2, 3, 0
		]);
		this.elementsVBO = gl.createBuffer();
		
		this.vpress = false;
	}

	update() {
		var mvtAmtx = this.zoom * deltaTime / 2000 * Math.sin(this.rot) * (shift ? 0.1 : 1) * (alt ? 0.1 : 1) * (ctrl ? 0.1 : 1);
		var mvtAmty = this.zoom * deltaTime / 2000 * Math.cos(this.rot) * (shift ? 0.1 : 1) * (alt ? 0.1 : 1) * (ctrl ? 0.1 : 1);
		if (keys['w']) {
			this.pos[0] += mvtAmtx;
			this.pos[1] += mvtAmty;
		}
		if (keys['s']) {
			this.pos[0] -= mvtAmtx;
			this.pos[1] -= mvtAmty;
		}
		if (keys['a']) {
			this.pos[0] -= mvtAmty;
			this.pos[1] += mvtAmtx;
		}
		if (keys['d']) {
			this.pos[0] += mvtAmty;
			this.pos[1] -= mvtAmtx;
		}

		//console.log(shift);
		var clrAmt = deltaTime / 1000 / 40;
		if (keys['z']) {
			this.clrRatio[0] += clrAmt * (shift ? -1 : 1);
			if (this.clrRatio[0] < 0) this.clrRatio[0] = 0;
			if (this.clrRatio[0] > 1) this.clrRatio[0] = 1;
		}
		if (keys['x']) {
			this.clrRatio[1] += clrAmt * (shift ? -1 : 1);
			if (this.clrRatio[1] < 0) this.clrRatio[1] = 0;
			if (this.clrRatio[1] > 1) this.clrRatio[1] = 1;
		}
		if (keys['c']) {
			this.clrRatio[2] += clrAmt * (shift ? -1 : 1);
			if (this.clrRatio[2] < 0) this.clrRatio[2] = 0;
			if (this.clrRatio[2] > 1) this.clrRatio[2] = 1;
		}

		var zmAmt = 0.9995;
		if (keys['i']) {
			this.zoom *= Math.pow(zmAmt, deltaTime);
		}
		if (keys['k']) {
			this.zoom /= Math.pow(zmAmt, deltaTime);
		}

		var rotAmt = deltaTime / 4000;
		if (keys['j']) this.rot -= rotAmt;
		if (keys['l']) this.rot += rotAmt;
		if (this.rot > 2 * Math.PI) this.rot -= 2 * Math.PI;
		if (this.rot < 0) this.rot += 2 * Math.PI;

		var iterAmt = 0.9995;
		if (keys['y']) this.maxIter /= Math.pow(iterAmt, deltaTime);
		if (keys['h']) this.maxIter *= Math.pow(iterAmt, deltaTime);

		if (keys['1']) this.mode = 1;
		if (keys['2']) this.mode = 2;
		if (keys['3']) this.mode = 3;
		if (keys['4']) this.mode = 4;
		if (keys['5']) this.mode = 5;
		if (keys['6']) this.mode = 6;
		if (keys['7']) this.mode = 7;
		if (keys['8']) this.mode = 8;
		if (keys['9']) this.mode = 9;
		
		if (keys['1'] && ctrl) this.innerMode = 1;
		if (keys['2'] && ctrl) this.innerMode = 2;
		if (keys['3'] && ctrl) this.innerMode = 3;

		var renderVarAmt = deltaTime / 1000 * 10 * (shift ? 0.1 : 1) * (alt ? 0.1 : 1) * (ctrl ? 0.1 : 1);
		if (keys['t']) this.renderVar += renderVarAmt;
		if (keys['g']) this.renderVar -= renderVarAmt;

		var cursorAmt = deltaTime / 1000 * (shift ? -1 : 1);
		if (keys['f']) this.cursor += cursorAmt;
		if (this.cursor < 0) this.cursor = 0;
		if (this.cursor > 1) this.cursor = 1;

		if (keys['r']) this.reset();

		var toVec3String = function(v) {
			return v[0].toFixed(6) + ", " + v[1].toFixed(6) + ", " + v[2].toFixed(6);
		}

		var toCNumString = function(v) {
			var s = v[0].toFixed(6);
		    if (v[1] >= 0) {
		        s += " + ";
		    } else {
		        s += " - ";
		    }
		    s += Math.abs(v[1].toFixed(6)) + "i";
		    return s;
		}

		this.text.innerHTML =
		" Pos: " + toCNumString(this.pos) +
		" Zoom: " + this.zoom.toFixed(6) +
		" Rotation: " + this.rot.toFixed(6) +
		" Max Iterations: " + Math.floor(this.maxIter) +
		" Colour: " + toVec3String(this.clrRatio) +
		" Mode: " + this.mode + " / " + this.innerMode;

	}

	reset() {
		this.zoom = 2;
		this.pos[0] = this.pos[1] = 0;
	}

	render(vc) {

		gl.useProgram(this.program);

		gl.uniform1i(this.maxIterUniformLocation, this.maxIter);

		gl.uniform3fv(this.clrRatioUniformLocation, new Float32Array(this.clrRatio));

		gl.uniform2fv(this.posUniformLocation, new Float32Array(this.pos));

		var rotMatrix = mat4.create();
		mat4.fromRotation(rotMatrix, this.rot, vec3.fromValues(0, 0, 1));
		gl.uniformMatrix4fv(this.rotUniformLocation, gl.FALSE, rotMatrix);

		gl.uniform1f(this.zoomUniformLocatiom, this.zoom);

		gl.uniform1f(this.aspectRatioUniformLocation, cv.width / cv.height);

		gl.uniform1i(this.modeUniformLocation, this.mode);
      gl.uniform1i(this.innerModeUniformLocation, this.innerMode);

		gl.uniform1f(this.renderVarUniformLocation, this.renderVar);

		gl.uniform1f(this.cursorUniformLocation, this.cursor);

		if (this.renderTarget === "julia") {
			gl.uniform2fv(this.vcUniformLocation, new Float32Array(vc));
		}
		
		gl.enableVertexAttribArray(this.vertexAttribLocation);
	   	gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesVBO);
	   	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
	   	gl.vertexAttribPointer(this.vertexAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

	   	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementsVBO);
  	 	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.elements, gl.STATIC_DRAW);

  	 	gl.drawElements(gl.TRIANGLES, this.elements.length, gl.UNSIGNED_SHORT, 0);
	}
}


var initRenderer = function() {

	cv = document.getElementById("cv");
	gl = cv.getContext("webgl");
	if (!gl) {
		console.log("WebGL not supported, falling back on experimental WebGL")
		gl = canvas.getContext("experimental-webgl");
	}
	if (!gl){
		alert("Your browser does not support WebGL");
		throw new Error();
	}

	mandText = document.getElementById("mandText");
	juliaText = document.getElementById("juliaText");
	fpsText = document.getElementById("fpsText");

	mandRenderer = new Renderer("mandelbrot");
	juliaRenderer = new Renderer("julia");

	mandRenderer.update();
	juliaRenderer.update();
}

var update = function() {
	if (mx < cv.width / 2) mandRenderer.update();
	else juliaRenderer.update();
	fpsText.innerHTML = "FPS: " + fps;
}

var render = function() {

	gl.clearColor(0.8, 0.8, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mandRenderer.render();
	juliaRenderer.render(mandRenderer.pos);
}

