var mandvsText =
[
"precision highp float;",
"",
"attribute vec2 vpos;",
"",
"varying vec2 fpos;",
"",
"void main(void) {",
"	gl_Position = vec4(vpos, 0, 1);",
"	fpos = vpos;",
"}",
].join("\n");
