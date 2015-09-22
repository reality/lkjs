var _ = require('underscore')._;

var isAxiom = function(input) {
  if(input[0].length == 1 && input[1].length == 1
      && _.isString(input[0][0])
      && input[0][0].match(/^[A-Z]$/)
      && input[0][0] == input[1][0]) {
    return true;
  } else {
    return false;
  }
};

var prettyOperation = function(item) {
  var out = item;
  if(_.isObject(item) && _.has(item, 'operation')) {
    if(item.operation == 'implies') {
      if(_.isObject(item.p1)) {
        item.p1 = '('+prettyOperation(item.p1)+')';
      }
      if(_.isObject(item.p2)) {
        item.p2 = '('+prettyOperation(item.p2)+')';
      }
      out = item.p1 + ' → ' + item.p2;
    }
  }
  return out;
};

var inferenceRules = [
  // LEFT RULES 

  function(input) { // AL1
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);
        
    if(element && element.operation == 'and') {
      left.splice(-1, 1, element.p1);
      success = true;
    }

    return [ success, 'AL1', input ];
  },

  function(input) { // AL2
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);
        
    if(element && element.operation == 'and') {
      left.splice(-1, 1, element.p2);
      success = true;
    }

    return [ success, 'AL2', input ];
  },

  /** TODO: SPLIT RULES
  function(input) { // IL
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
  */

  function(input) { // NL
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);
        
    if(element && element.operation == 'not') {
      right.push(element.p1); // this may actually have to be prepended
      left.splice(-1);
    }

    return [ success, 'NL', input ];
  },

  // Structural Rules

  function(input) { // WL
    var left = input[0],
        right = input[1],
        success = false;

    if(right.length >= 1) {
      left.splice(-1);
      success = true;
    }

    return [ success, 'WL', input ];
  },

  function(input) { // CL
    var left = input[0],
        right = input[1],
        element = _.last(left),
        success = false;

    if(element) {
      left.push(element);
      success = true;
    }

    return [ success, 'CL', input ];
  },

  function(input) { // PL
    var left = input[0],
        right = input[1],
        success = false;

    if(left.length >= 2) {
      var i = left.splice(-2, 1);
      left.push(i[0]);
      success = true;
    }

    return [ success, 'PL', input ];
  },

  // RIGHT RULES START HERE

  // Logical rules

  function(input) { // AR1
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'or') {
      right[0] = right[0].p1;
      success = true;
    }

    return [ success, 'AR1', input ];
  },

  function(input) { // AR2
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'or') {
      right[0] = right[0].p2;
      success = true;
    }

    return [ success, 'AR2', input ];
  },

  function(input) { // IR
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'implies') {
      left.push(right[0].p1)
      right[0] = right[0].p2;
      success = true;
    }

    return [ success, 'IR', input ];
  },

  function(input) { // NR
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'not') {
      left.push(right[0].p1);
      right.splice(0, 1);
    }

    return [ success, 'NR', input ];
  },

  // Structural Rules

  function(input) { // WR
    var left = input[0],
        right = input[1];

//console.log('before wr');
//console.log(right);
    right.splice(0, 1);
//console.log('after wr');
//console.log(right);

    return [ true, 'WR', input ];
  },

  function(input) { // CR
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
        success = false;

    if(right.length >= 3 && right[0] != right[1]) {
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
      nextTracks = [],
      trackCount = 1;

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
            trackCount++;
          });
        }
      }
    });

    if(solutionFound) {
      console.log();

      console.log('SOLUTION FOUND ON STEP ' + x);

      console.log();

      console.log('Proof:')
      
      _.each(solutionFound, function(val, step) {
        console.log('    Step: ' + (step+1));
        console.log('      Operation: ' + val[0]);

        _.each(val[1][0], function(op, i) {
          val[1][0][i] = prettyOperation(op); 
        });
        _.each(val[1][1], function(op, i) {
          val[1][1][i] = prettyOperation(op); 
        });

        console.log('      Value: ' + val[1][0] + ' ⊢ ' + val[1][1]);
      });

      console.log();

      console.log('Stats:');
      console.log('  Rounds: ' + x);
      console.log('  Tracks: ' + trackCount);

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

//    if(x==2) break;
  }
};

// Each array symbolises its respective side of the sequent ⇒
//var input = [[], ['implies(implies(A,implies(B,C)),implies(implies(A,B),implies(A,C)))']];

/*var input = [ [], [
  {
    'operation': 'implies',
    'p1': { 
      'operation': 'implies',
      'p1': {
        'operation': 'implies',
        'p1': 'B',
        'p2': 'C'
      },
      'p2': {
        'operation': 'implies',
        'p1': 'B',
        'p2': 'C'
      }
    },
    'p2': {
      'operation': 'implies',
      'p1': {
        'operation': 'implies',
        'p1': 'A',
        'p2': 'B'
      },
      'p2': {
        'operation': 'implies',
        'p1': 'A',
        'p2': 'C'
      }
    }
  }
]];*/

var input = [[], [
  {
    'operation': 'implies',
    'p1': 'A',
    'p2': {
      'operation': 'implies',
      'p1': 'B',
      'p2': 'A'
    }
  }
]];

reason(input);
