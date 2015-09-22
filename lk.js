var _ = require('underscore')._;

var term = /^[A-Z]$/,
    nterm = /^¬[A-Z]$/,
    or = /^∨$/;
    

// Negate a term
var negate = function(term) {
  return term.indexOf('¬') == 0 ? term.slice(1) : '¬' + term;
};

var isAxiom = function(input) {
  if(input[0].length == 1 && input[1].length == 1 
      && input[0][0].match(term) && input[1][0].match(term) 
      && input[0][0] == input[1][0]) {
    return true;
  } else {
    return false;
  }
};

var inferenceRules = [
  // LEFT RULES 

  // Logical rules
/*
  function(input) { // AL1
    var left = input[0],
        right = input[1]
        item = _.last(left, 3);

    if(item[0].match(term) && item[1].match(and) && item[2].match(term)) {
      left.splice(-2);
    }
    return input;
  },

  function(input) { // AL2
    var left = input[0],
        right = input[1],
        item = _.last(left, 3);

    if(item[0].match(term) && item[1].match(and) && item[2].match(term)) {
      right.splice(-3, 2);
    }
    return input;
  },

  function(input) { // IL; this seems to split it in two, so TODO this
    var left = input[0],
        right = input[1],
        item = _.last(left, 3);

    if(right[0].match(term) && right[1].match(implies) && right[2].match(term)) {
      left.push(right[0]);
      right.splice(0, 2);
    }
    return input;
  },

  // TODO not done after this point
  function(input) { // NR
    var left = input[0],
        right = input[1];

    if(right[0].match(nterm)) {
      left.push(negate(right[0]));
      right.splice(0, 1);
    }
    return input;
  },

  // Structural Rules

  function(input) { // WR
    var left = input[0],
        right = input[1];

    if(right[0].match(term))
      right.splice(0, 1);
    }
    return input;
  },

  function(input) { // CR; this sounds like an infinite loop waiting to happen
    var left = input[0],
        right = input[1];

    if(right[0].match(term) && right[1].match(term) && right[0] == right[1])
      right.splice(0, 1);
    }
    return input;
  },

  function(input) { // PR
    var left = input[0],
        right = input[1];

    if(right[0].match(term) && right[1].match(term)) { // PR
      var t = right[0];
      right[0] = right[1];
      right[1] = t;
    }
    return input;
  },*/

  // RIGHT RULES START HERE

  // Logical rules

  function(input) { // AR1
    var left = input[0],
        right = input[1]
        pattern = right[0].match(/^(¬?[A-Z])∨(¬?[A-Z])$/);

    if(pattern) {
      console.log('Matched AR1 rule.');
      right[0] = pattern[1];
    }

    return [ pattern != null, input ];
  },

  function(input) { // AR2
    var left = input[0],
        right = input[1]
        pattern = right[0].match(/^(¬?[A-Z])∨(¬?[A-Z])$/);

    if(pattern) {
      console.log('Matched AR2 rule.');
      right[0] = pattern[2];
    }

    return [ pattern != null, input ];
  },

  function(input) { // IR
    var left = input[0],
        right = input[1],
        pattern = right[0].match(/^(¬?[A-Z])→(¬?[A-Z])$/);

    if(pattern) {
      console.log('Matched IR rule.');
      right[0] = pattern[1];
      left.push(pattern[0]);
    }

    return [ pattern != null, input ];
  },

  function(input) { // NR
    var left = input[0],
        right = input[1];
        pattern = right[0].match(/^¬([A-Z])$/);

    if(pattern) {
      console.log('Matched NR rule.');
      left.push(pattern[1]);
      right.splice(0, 1);
    }

    return [ pattern != null, input ];
  },

  // Structural Rules

  function(input) { // WR
    var left = input[0],
        right = input[1];

    console.log('Matched WR rule.');
    right.splice(0, 1);

    return [ true, input ];
  },

  function(input) { // CR; this sounds like an infinite loop waiting to happen
    var left = input[0],
        right = input[1];

    console.log('Matched CR rule.');
    right.splice(1, 0, right[0]);

    return [ true, input ];
  },

  function(input) { // PR
    var left = input[0],
        right = input[1],
        patternA = right[0].match(/^(¬?[A-Z])$/),
        patternB = false,
        success = false;

    if(right[1]) {
      patternB = right[1].match(/^(¬?[A-Z])$/);
    }

    if(patternA && patternB && patternA[1] != patternB[1]) {
      console.log('Matched PR rule.');
      var t = right[0];
      right[0] = right[1];
      right[1] = t;
      success = true;
    }

    return [ success, input ];
  }
];

// >_>
var copyInput = function(input) {
  var inputCopy = input.slice();

  inputCopy[0] = inputCopy[0].slice();
  inputCopy[1] = inputCopy[1].slice();

  return inputCopy;
}

// One round of inference rule application
var applyRules = function(input) {
  var results = [];

  for(var i=0;i<inferenceRules.length;i++) {
    var cInput = copyInput(input),
        output = inferenceRules[i](cInput);

    if(output[0] == true) { // Success
      results.push(output[1]);
    }
  }

  return results;
};

var infer = function(input) {
  console.log(input);

  tracks = [ [ input ] ];
  solutionFound = false;

  var x = 0;
  while(true) {
    x++;

    _.each(tracks, function(track, i) {
    console.log(track);
      var last = _.last(track);

      if(last == false) {
        return false; // Dead track
      } else if(isAxiom(last)) {
        solutionFound = track; 
        return true;
      } else if(input[0].length == 0 && input[1].length == 0) {
        track.push(false);
        return false;
      } else {
        // Run inference round
        var results = applyRules(last);
        if(results.length == 0) { // track dead
          track.push(false);
          return false;
        } else {
          _.each(results, function(r) {
            // create a new track with the same history but with a new end 
            var newTrack = track.slice();
            newTrack.push(r);
            tracks.push(newTrack);
          });
          
          // Delete the old track
          tracks.splice(i, 1); 
        }
      }
    });

    if(solutionFound) {
      console.log('BOOM ' + solutionFound);
      break;
    }

    console.log('Round ' + x + ' complete! Tracks: ');
    _.each(tracks, function(track, i) {
      console.log('  Track ' + i);
      _.each(track, function(val, step) {
        console.log('    Step ' + step);
        console.log('      ' + val);
      });
    });
    break;
  }
};

// Each array symbolises its respective side of the sequent ⇒
var input = [[], ['A∨¬A']];

console.log(infer(input));
