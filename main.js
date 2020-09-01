var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'void main() {\n' +
  ' gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n'+
  '}\n';

  var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main(){\n'+
  ' gl_FragColor = u_FragColor;\n'+
  '}\n';

  function restart(){
    index = 0;
    g_points = [];
    g_colors = [];
    selectedFig = 0;
    selectedFace = 0;
    quantityOfPoints = 0;
    concludedFace = 0;
    modelMatrixes = []
    maxFigures = 0;  
    kendoConsole.log("Restart");
    main();
  }

  
  // Getting the values for the affine transformations

  function onChangeRot(e) {
    kendoConsole.log("Change :: new Rotation value is: " + e.value);
    value = e.value;
    if (axis == "X") rotX = value;
    if (axis == "Y") rotY = value;
    if (axis == "Z") rotZ = value;
    changeTransformations();
    main();
  }

  function onChangeTrans(e) {
    kendoConsole.log("Change :: new Translate value is: " + e.value);
    value = e.value;
    if (axis == "X") transX = value;
    if (axis == "Y") transY = value;
    if (axis == "Z") transZ = value;
    changeTransformations();
    main();
  }

  function onChangeScale(e) {
    kendoConsole.log("Change :: new Scale value is: " + e.value);
    value = e.value;
    if (axis == "X") scaleX = value;
    if (axis == "Y") scaleY = value;
    if (axis == "Z") scaleZ = value;
    changeTransformations();
    main();
  }

  var minAngle = -360;
  var maxAngle = 360;

  $(document).ready(function() {
    $("#slider").kendoSlider({
      change: onChangeRot,
      min: minAngle,
      max: maxAngle,
      smallStep: 10,
      largeStep: 60,
      value: 0
    });
    $("#sliderTrans").kendoSlider({
      change: onChangeTrans,
      min: -2.0,
      max: 2.0,
      smallStep: 0.1,
      largeStep: 0.5,
      value: 0.0
    });
    $("#sliderScale").kendoSlider({
      change: onChangeScale,
      min: 0.5,
      max: 5.0,
      smallStep: 0.3,
      largeStep: 0.8,
      value: 1.0
    });

    
  });

function main(){
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  if(!gl){
    console.log('Failed to get the WebGL context');
    return;
  }

  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
    console.log('Failed to initialize shaders');
    return;
  }

  canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
  canvas.oncontextmenu = function(ev){ rightClick(ev, gl, false); return false;};

  // To finish an object and not continue to add faces, you must "F" to
  // conclude the object.
  document.onkeydown = function(ev){
    ev = ev || window.event;
    if (ev.keyCode == "70") // F KEYCODE
      {
        if (Array.isArray(g_points[maxFigures]) && g_points[maxFigures].length && g_points[maxFigures].length >= 1){
          rightClick(ev, gl, true);
        }
        else{
          kendoConsole.log("Not object created");
        }
        
      }
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  draw(gl);
}

var axis = "X";

function changeAxis(){
  axis = document.getElementById("selectAxis").value;
  kendoConsole.log("Changed to " + axis + " axis");
}

function addElementsToSelect(numFig){
  var select = document.getElementById("selectFig");
  var newOption = document.createElement("option")
  newOption.text = "Figure " + numFig;
  select.add(newOption);
}

function removeFigure(){
  var select = document.getElementById("selectFig");
  if (maxFigures > 0){
    
    
    select.remove(maxFigures-1);
    kendoConsole.log("Deleted figure");
    
    if (maxFigures == 1){
      restart();
    }
    else{
      // Removing the information of the object (matrix, colors, points)
      g_points.splice(selectedFig, 1);
      g_colors.splice(selectedFig, 1);
      modelMatrixes.splice(selectedFig, 1);
      selectedFig = 0;
      selectedFace = 0;
      quantityOfPoints = 0;
      concludedFace = 0;
      maxFigures = g_points.length;
      // Drawing the scene
      main();
    }
    
    
  }
  else{
    kendoConsole.log("Not object to delete");
  }
}

function select(){
  var select = document.getElementById("selectFig");
  var value = select.value;
  if (value == ""){
    kendoConsole.log("Not figure available")
  }
  else{
    // Know which option was selected
    selectedFig = parseInt(value.split(" ")[1]);
    console.log(value)
    kendoConsole.log(value + " selected");
  }
  
}

function changeTransformations(){
  // Give the selected object the values of the sliders
  modelMatrixes[selectedFig] = new Matrix4();
  modelMatrixes[selectedFig].rotate(rotX, 0.5, 0, 0);
  modelMatrixes[selectedFig].rotate(rotY, 0.0, 0.5, 0.0);
  modelMatrixes[selectedFig].rotate(rotZ, 0.0, 0.0, 0.5);
  modelMatrixes[selectedFig].scale(scaleX, scaleY, scaleZ);
  modelMatrixes[selectedFig].translate(transX, transY, transZ);
}


function rightClick(ev, gl, itsFigureDone) {
  if (quantityOfPoints > 2){
    if(itsFigureDone){
      // When the user does the action to finish the object
      kendoConsole.log("Object Finished");
      addElementsToSelect(maxFigures);
      maxFigures++;
      selectedFace = 0;
      quantityOfPoints = 0;
    }
    else if(concludedFace == 0){
      // When creating another face to the object
      selectedFace++;
      console.log("y")
      concludedFace = 1;
      
    }
    draw(gl);
  }
  else{
    kendoConsole.log("Required more than 2 points")
  }
  
}

function initVertexBuffers(gl, vertices, red, green, blue, alpha, index, faceID, modelMatrixes){
  var n = vertices.length/3;
  var vertexBuffer = gl.createBuffer();

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position<0){
    console.log('Failed to get program for a_Position');
    return;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix){ console.log('Failed to get location of u_ModelMatrix'); return;  }
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrixes[index].elements);

  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if(!u_ViewMatrix){ console.log('Failed to get location of u_ViewMatrix'); return;  }
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0.0, 0.0, 1.8, 0.0,0.0,0.0, 0.0,1.0,0.0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if(!u_ProjMatrix){ console.log('Failed to get location of u_ProjMatrix'); return;  }
  var projMatrix = new Matrix4();
  projMatrix.setOrtho(-1.0,1.0,-1.0, 1.0,0.1,10.0);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  gl.uniform4f(u_FragColor, red, green, blue, alpha);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  return n;
}

function draw(gl){
  gl.clear(gl.COLOR_BUFFER_BIT);
  for(var i = 0; i < g_points.length; i++){
    for (var j = 0; j < g_points[i].length; j++){
      // Giving the RGB values as the main color of the object
      var red = g_colors[i][0];
      var green = g_colors[i][1];
      var blue = g_colors[i][2];
      var n = initVertexBuffers(gl, new Float32Array(g_points[i][j]), red, green, blue, 1.0, i, j, modelMatrixes);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
    
  }
}

// Letting user to change the color of the present or selected object

var colorPicker = document.getElementById("colorSelect");
colorPicker.addEventListener("input", function (){
  var color = colorPicker.value;
  // Taking the values correspoding to the RGB values
  const red = parseInt(color.substr(1,2), 16)
  const green = parseInt(color.substr(3,2), 16)
  const blue = parseInt(color.substr(5,2), 16)
  kendoConsole.log("New color: R: " + red + " G: " +  green + " B: " +  blue);
  // Because the colors are up to 1.0
  g_colors[selectedFig] = [red/255, green/255, blue/255];
  main();
}, false);


var concludedFace = 0;
var transX = 0.0, transY = 0.0, transZ = 0.0;
var scaleX = 1.0, scaleY = 1.0, scaleZ = 1.0;
var rotX = 0.0, rotY = 0.0, rotZ = 0.0;
var g_points = [];
var g_colors = [];
var selectedFig = 0;
var selectedFace = 0;
var quantityOfPoints = 0;
// first element is the figure from where it is, the three next points are the x, y, z values
var modelMatrixes = []
var maxFigures = 0;  


function click(ev, gl, canvas) {
  if(event.buttons == 1){
    const canvas = gl.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

   clipX = x / rect.width  *  2 - 1;
   clipY = y / rect.height * -2 + 1;
    quantityOfPoints++;
    if (g_points.length <= maxFigures){
      // Creating a new space for the new figure
      g_points[maxFigures] = [];
      modelMatrixes[maxFigures] = new Matrix4();
      g_colors[maxFigures] = [Math.random(), Math.random(),Math.random()];
    }
    if(g_points[maxFigures].length <= selectedFace){
      var arrayPoints = [];
      g_points[maxFigures].push(arrayPoints);
    }
    if (concludedFace == 1){
      concludedFace = 0;
    }
    g_points[maxFigures][selectedFace].push(clipX);
    g_points[maxFigures][selectedFace].push(clipY);
    
    var z = 0.0;
    if(ev.ctrlKey){
      z = -0.5;
    } else if(ev.shiftKey) {
      z = -1.0;
    }
    g_points[maxFigures][selectedFace].push(z);
    
    draw(gl);
  }
}
