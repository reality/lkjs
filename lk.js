var _ = require('underscore')._;

var isAxiom = function(input) {
  if(input[0].length == 1 && input[1].length == 1 
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
        right = input[1],
        pattern = null;
        
    if(right[0]) {
      pattern = right[0].match(/^(¬?[A-Z])∨(¬?[A-Z])$/);
    }

    if(pattern) {
      right[0] = pattern[1];
    }

    return [ pattern != null, 'AR1', input ];
  },

  function(input) { // AR2
    var left = input[0],
        right = input[1],
        pattern = null;
        
    if(right[0]) {
      pattern = right[0].match(/^(¬?[A-Z])∨(¬?[A-Z])$/);
    }

    if(pattern) {
      right[0] = pattern[2];
    }

    return [ pattern != null, 'AR2', input ];
  },

  function(input) { // IR
    var left = input[0],
        right = input[1],
        pattern = null;
        
    if(right[0]) {
      pattern = right[0].match(/^(¬?[A-Z])→(¬?[A-Z])$/);
    }

    if(pattern) {
      right[0] = pattern[1];
      left.push(pattern[0]);
    }

    return [ pattern != null, 'IR', input ];
  },

  function(input) { // NR
    var left = input[0],
        right = input[1],
        pattern = null;
        
    if(right[0]) {
      pattern = right[0].match(/^¬([A-Z])$/);
    }

    if(pattern) {
      left.push(pattern[1]);
      right.splice(0, 1);
    }

    return [ pattern != null, 'NR', input ];
  },

  // Structural Rules

  function(input) { // WR
    var left = input[0],
        right = input[1];

    right.splice(0, 1);

    return [ true, 'WR', input ];
  },

  function(input) { // CR; this sounds like an infinite loop waiting to happen
    var left = input[0],
        right = input[1];

    if(right[0]) {
      right.splice(1, 0, right[0]);
    }

    return [ true, 'CR', input ];
  },

  function(input) { // PR
    var left = input[0],
        right = input[1],
        patternA = false,
        patternB = false,
        success = false;

    if(right[0]) {
      patternA = right[0].match(/^(¬?[A-Z])$/);
    }

    if(right[1]) {
      patternB = right[1].match(/^(¬?[A-Z])$/);
    }

    if(patternA && patternB && patternA[1] != patternB[1]) {
      var t = right[0];
      right[0] = right[1];
      right[1] = t;
      success = true;
    }

    return [ success, 'PR', input ];
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
      results.push([ output[1], output[2] ]);
    }
  }

  return results;
};

var reason = function(input) {
  console.log(input);

  tracks = [ [ [ 'IN', input ] ] ];

  var x = 0,
      solutionFound = false,
      nextTracks = [];

  while(true) {
    x++;

    _.each(tracks, function(track, i) {
      var last = _.last(track)[1];

      if(_.last(track) == false) {
        return false; // Dead track
      } else if(isAxiom(last)) {
        solutionFound = track; 
        return true;
      } else if(last[0].length == 0 && last[1].length == 0) {
        track.push(false);
        return false;
      } else {
        // Run inference round
        var results = applyRules(last);
        if(results.length == 0) { // track dead
          track.push([false, false]);
          return false;
        } else {
          _.each(results, function(r) {
            // create a new track with the same history but with a new end 
            var newTrack = track.slice();
            newTrack.push(r);
            nextTracks.push(newTrack);
          });
        }
      }
    });

    if(solutionFound) {
      console.log('SOLUTION FOUND ON STEP ' + x);
      console.log('Proof:')
      
      _.each(solutionFound, function(val, step) {
        console.log('    Step: ' + (step+1));
        console.log('      Operation: ' + val[0]);
        console.log('      Value: ' + val[1][0] + ' ⇒ ' + val[1][1]);
      });

      break;
    }

    tracks = nextTracks;

    console.log('Round ' + x + ' complete! Tracks: ');
    _.each(tracks, function(track, i) {
      console.log('  Track ' + i);
      _.each(track, function(val, step) {
        console.log('    Step ' + step);
        console.log('      ' + val);
      });
    });
  }
};

// Each array symbolises its respective side of the sequent ⇒
var input = [[], ['A∨¬A']];

reason(input);
