/**

 * plugin for implementing a continuous report task, using the snap.io plugin.
 * written by Victoria J.H. Ritvo, 2019

 **/


jsPsych.plugins["continuous_report"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'continuous_report',
    description: 'Uses Snap.svg to implement the continuous report task',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The HTML string to be displayed'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when subject makes a response.'
      },
      condType: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'condition',
        default: null,
        description: 'stimulus condition'
      },
    }
  }

  // MAIN CODE OF PLUG IN
  plugin.trial = function(display_element, trial) {
    var response = {
      rt: null,
      mouseX: null,
      mouseY: null,
      col: null,
    };

    var stimParameters = {};

    // get the image file location
    var currStim = 'images/stim/' + trial.stimulus + '.svg';



    function getRndInteger(min, max) { // this function sets a random number between min and max, inclusive
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // randomize the color wheel for this trial:
    var randomColorVal = getRndInteger(1, 359); //359 because that's the 360th element, since it starts at 0.
    originalColorWheel = colors.colors;
    // step 1: slice at this number
    var colorsFirstHalf = originalColorWheel.slice(randomColorVal, originalColorWheel.length);
    // step 2: slice to get the array leading up to it
    var colorsSecondHalf = originalColorWheel.slice(0, randomColorVal);
    var both = colorsFirstHalf.concat(colorsSecondHalf);
    var currColorWheel = both;


    // set the svg dimensions, to add to the innerHTML
    var svgWidth = 600;
    var svgHeight = 600;

    // create the svg object
    display_element.innerHTML = "<svg id='svg', width = '" + svgWidth.toString() + "', height = '" + svgWidth.toString() + "'/svg>";

    // set the center points (relative to the SVG)
    var centerXSVG = svgWidth / 2,
      centerYSVG = svgHeight / 2;

    var angleDeg = 0;
    var curError = 360;

    // create the snap paper
    var paper = Snap("#svg");


    // create the pointer. Here, it's set to appear at the top of the circle at the start of a trial.
    var colPointer = paper.circle(300, 100, 15).attr({
      stroke: "black",
    });



    var mouseX, mouseY;

    $(function() {
      $(document).bind('mousemove.overall', function(e) {

        // get coordinates of the SVG bounding box in Absolute terms (not svg coordinates)
        var svgObj = document.getElementById("svg");
        var rect = svgObj.getBoundingClientRect();

        // get the center coordinates in absolute terms (not svg coordinates)
        centerXDom = rect.x + centerXSVG;
        centerYDom = rect.y + centerYSVG;

        // calculate angle (done with absolute, DOM coordintes)
        var output = calculateColor(e.pageX, e.pageY); //get imgCol
        var imgCol = output[0];
        var curAngle = output[1];


        stimParameters.col = currColorWheel[imgCol];
        currHexColor = Snap.rgb(stimParameters.col[0], stimParameters.col[1], stimParameters.col[2]);

        // calculate the pointer position based on SVG coordinates
        var pointerX = Math.round(centerXSVG + Math.cos(curAngle) * 200);
        var pointerY = Math.round(centerYSVG + Math.sin(curAngle) * 200);
        colPointer.attr({
          cx: pointerX,
          cy: pointerY,
        });

      });
    }); // end of mousetracking


    var calculateColor = function(xPos, yPos) { //first output is the color number, second output is the current angle
      // calculate angle (done with absolute, DOM coordinates)
      var relX = xPos - centerXDom;
      var relY = yPos - centerYDom;
      var curAngle = Math.atan2(relY, relX);
      angleDeg = curAngle / Math.PI * 180.0;
      angleDeg = (angleDeg < 0) ? angleDeg + 360 : angleDeg;

      // change this to an image color
      var imgCol = Math.floor(angleDeg);
      return [imgCol, curAngle];

    }


    // create the color wheel
    var colorWheel = paper.circle(300, 300, 200).attr({
      stroke: "black",
      fill: "none",
      "stroke-width": 10,
      cx: 300,
      cy: 300,
    })


    // % set the image position based on svg paper dimensions.
    // this may have to be changed depending on the size of the image. The demo images are 100 x 100.
    var imageX = centerXSVG - 100 / 2;
    var imageY = centerYSVG / 2 - 100 / 2;

    // load in the images
    var g = paper.group();

    Snap.load(currStim, function(fragment) {
      var element = fragment.select('#Layer_1');
      g.add(element);
      element.attr({
        width: "100",
        height: "100",
        x: imageX.toString(), //position of the image, as a string
        y: imageX.toString(), //position of the image, as a string
        //
      });

      // select the image itself within the svg
      var shape = element.select('path');

      $(document).mousemove(function(event) {
        shape.attr({
          "fill": currHexColor
        });


      });

    });
    var startTime = new Date();
    /* Always track the mouse */

    $(document).bind("click.trialResponse", function(e) {
      var rt = (new Date()) - startTime;
      var xClicked = e.pageX;
      var yClicked = e.pageY;

      var responseOutput = calculateColor(xClicked, yClicked);
      var colorNumResponse = responseOutput[0];
      var colorResponse = currColorWheel[colorNumResponse];

      for (i = 0 ; i < colors.colors.length; i ++) {
        if ( colors.colors[i] == colorResponse ) {
          var trueIndex = i
        }
      }
      var trial_data = {
        "rt": rt,
        "stimulus": trial.stimulus,
        "condType": trial.condType,
        "xClicked": xClicked,
        "yClicked": yClicked,
        "responseCol": colorResponse,
        "responseInd":trueIndex,
        "responseError" : trueIndex - trial.colIndex,
        "correctCol": originalColorWheel[trial.colIndex],
        "correctColIndex": trial.colIndex,
      };

      $(document).unbind("click.trialResponse")
      $(document).unbind("mousemove.overall")

      after_response(trial_data)

    });




    // function to handle responses by the subject
    function after_response(trial_data) {
      // only record first response

      delete startTime;

      if (trial.response_ends_trial) {
        end_trial(trial_data);
      }
    };


    // // function to end trial when it is time
    var end_trial = function(trial_data) {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
    };


  };

  return plugin;
})();
