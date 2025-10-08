// Import required modules
var mouse = require('mouse-position')();
var triangle = require('a-big-triangle');
var throttle = require('frame-debounce');
var fit = require('canvas-fit');
var getContext = require('gl-context');
var compare = require('gl-compare');
var createShader = require('glslify');
var createFBO = require('gl-fbo');
var fs = require('fs');

// Cache frequently used DOM elements
var container = document.getElementById('container');
var canvas = container.appendChild(document.createElement('canvas'));

// Load README content
var readme = fs.readFileSync(__dirname + '/README.md', 'utf8');

// Initialize WebGL context and comparison object
var gl = getContext(canvas, render);
var comparison = compare(gl, createLoop('actual'), createLoop('expected'));

// Configure comparison settings
comparison.mode = 'slide';
comparison.amount = 0.5;

// Initialize common module
require('../common')({
  description: readme,
  compare: comparison,
  canvas: canvas,
  dirname: process.env.dirname
});

// Handle window resize event
window.addEventListener('resize', fit(canvas), false);

// Define render function
function render() {
  comparison.run();
  comparison.render();
}

// Create and cache shaders
var shaders = {
  actual: createShader({
    frag: process.env.file_render_frag,
    vert: './shaders/triangle.vert'
  })(gl),
  expected: createShader({
    frag: './shaders/expected.frag',
    vert: './shaders/triangle.vert'
  })(gl),
  display: createShader({
    frag: './shaders/display.frag',
    vert: './shaders/triangle.vert'
  })(gl)
};

// Create and cache FBOs for outputs and inputs
var outputs = {
  actual: createFBO(gl, [512, 512]),
  expected: createFBO(gl, [512, 512])
};

var inputs = {
  actual: createFBO(gl, [512, 512]),
  expected: createFBO(gl, [512, 512])
};

// Define createLoop function
function createLoop(key) {
  return function render(fbo) {
    // Set up output FBO
    outputs[key].shape = [canvas.height, canvas.width];
    outputs[key].bind();

    // Set up shader and uniforms
    shaders[key].bind();
    shaders[key].uniforms.uTexture = inputs[key].color[0].bind(0);
    shaders[key].uniforms.uMouse = [mouse.x, canvas.height - mouse.y];

    // Render triangle
    triangle(gl);

    // Set up display FBO
    fbo.shape = [canvas.height, canvas.width];
    fbo.bind();

    // Set up display shader and uniforms
    shaders.display.bind();
    shaders.display.uniforms.uTexture = outputs[key].color[0].bind(0);
  };
}