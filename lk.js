var _ = require('underscore')._;

var isAxiom = function(input) {
  if(input[0].length == 1 && input[1].length == 1) {
    var a = input[0][0],
        b = input[1][0];

    if(_.isObject(a) && _.isObject(b) && a.operation == 'not' && b.operation == 'not') {
      a = a.p1;
      b = b.p1;
    }

console.log(a);
console.log(b);
    if(_.isString(a) && a == b) {
      return true;
    }
  } else {
    return false;
  }
};

var prettyOperation = function(item) {
  var out = item,
      p1 = item.p1,
      p2 = item.p2;

  if(_.isObject(item) && _.has(item, 'operation')) {
    if(item.p1 && _.isObject(item.p1)) {
      p1 = '('+prettyOperation(item.p1)+')';
    }
    if(item.p2 && _.isObject(item.p2)) {
      p2 = '('+prettyOperation(item.p2)+')';
    }

    if(item.operation == 'implies') {
      out = p1 + ' → ' + p2;
    } else if(item.operation == 'or') {
      out = p1 + ' ∨ ' + p2;
    } else if(item.operation == 'and') {
      out = p1 + ' ∧ ' + p2;
    } else if(item.operation == 'not') {
      out = '¬' + p1;
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

  // TODO: SPLIT RULES
  function(input) { // IL
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);

    if(element && element.operation == 'implies') {

      //console.log('B4IL');
      //console.log(input);

      var nFormula = [[ element.p2 ], right.splice(0) ];

      right.push(element.p1);
      left.splice(-1);

      //console.log('IL');
      //console.log(nFormula);

      success = true;
    }

    return [ success, 'IR', input, nFormula ];
  },
  /*Here we should turn e.g.
  (b or c), not c, (b implies (not a)) -> (not a)
  into 
    b or c, (not c) -> b
    (not a) -> (not a)*/

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

  function(input) { // OR1
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'or') {
      right[0] = right[0].p1;
      success = true;
    }

    return [ success, 'OR1', input ];
  },

  function(input) { // OR2
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'or') {
      success = true;
      right[0] = right[0].p2;
      success = true;
    }

    return [ success, 'OR2', input ];
  },

  function(input) { // AR
    var left = input[0],
        right = input[1],
        success = false;
        
    if(right[0] && right[0].operation == 'and') {
      success = true;
      right[0] = right[0].p2;
      success = true;
    }

    return [ success, 'OR2', input ];
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
      success = true;
    }

    return [ success, 'NR', input ];
  },

  // Structural Rules

  function(input) { // WR
    var left = input[0],
        right = input[1];

    right.splice(0, 1);

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
      results.push([ output[1], output[2], output[3] ]);
    }
  }

  return results;
};

var reason = function(input) {
  console.log(input);

  var x = 0,
      formulae = [ [ { 
        'dependency': null,
        'steps': [ [ 'IN', input ] ],
      }] ],
      solutionFound = false,
      nextTracks = [],
      trackCount = 1,
      formula;

  while(true) {
    x++;
    for(var y=0;y<formulae.length;y++) {
      formula = formulae[y];
      _.each(formula, function(track, i) {
        var last = _.last(track.steps)[1];
        console.log(last);

        if(_.last(track.steps) == false) {
          return false; // Dead track
        } else if(isAxiom(last)) {
        console.log(formula);
          if(formula.dependency === null) {
            solutionFound = track; 
            return true;
          } else {
            console.log('waiting til its mate is done'); 
          }
        } else if(last[0].length == 0 && last[1].length == 0) {
          track.steps.push(false);
          return false;
        } else {
          // Run inference round
          var results = applyRules(last);
          if(results.length == 0) { // track dead
            track.push([false, false]);
            return false;
          } else {
            _.each(results, function(r) {
              if(r[2]) {
              console.log('making new formula');
                // Set up a new formula
                formulae.push([{
                  'dependency': y,
                  'steps': [ [ r[0], r[2] ] ]
                }]);

                track.dependency = formulae.length-1;

                r.splice(-1);
              }

              // create a new track with the same history but with a new end 
              newTrack = _.clone(track);
              newTrack.steps = track.steps.slice();

              newTrack.steps.push(r);
              nextTracks.push(newTrack);
              trackCount++;
            });
          }
        }
      });

      formulae[y] = nextTracks;
/*
      console.log('Round ' + x + ' formula ' + y + ' complete! Tracks: ');
      _.each(formula, function(track, i) {
        console.log('  Track ' + i);
        _.each(track.steps, function(val, step) {
          console.log('    Step ' + step);
          if(val != false) {
            console.log('      Operation: ' + val[0]);

            var prettified = [[],[]];

            _.each(val[1][0], function(op, i) {
              prettified[0][i] = prettyOperation(op); 
            });
            _.each(val[1][1], function(op, i) {
              prettified[1][i] = prettyOperation(op); 
            });
            
            console.log('      Value: ' + prettified[0].join(', ') + ' ⊢ ' + prettified[1].join(', '));
          }
        });
      });*/
    };

    if(x==2) break;

    if(solutionFound) {
      console.log();

      console.log('SOLUTION FOUND ON STEP ' + x);

      console.log();

      console.log('Proof:')
      
      _.each(solutionFound.steps, function(val, step) {
        console.log('    Step: ' + (step+1));
        console.log('      Operation: ' + val[0]);

        _.each(val[1][0], function(op, i) {
          val[1][0][i] = prettyOperation(op); 
        });
        _.each(val[1][1], function(op, i) {
          val[1][1][i] = prettyOperation(op); 
        });

        console.log('      Value: ' + val[1][0].join(', ') + ' ⊢ ' + val[1][1].join(', '));
      });

      console.log();

      console.log('Stats:');
      console.log('  Rounds: ' + x);
      console.log('  Tracks: ' + trackCount);

      break;
    }

  }
};

// Each array symbolises its respective side of the sequent ⇒
//var input = [[], ['implies(implies(A,implies(B,C)),implies(implies(A,B),implies(A,C)))']];

/*var input = [ [], [
  {
    'operation': 'implies',
    'p1': { 
      'operation': 'implies',
      'p1': 'A',
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
]];
*/
/*
var input = [ [], [ {
    'operation': 'implies',
    'p1': {
      'operation': 'implies',
      'p1': {
        'operation': 'not',
        'p1': 'A'
      },
      'p2': {
        'operation': 'not',
        'p1': 'B'
      }
    },
    'p2': {
      'operation': 'implies',
      'p1': 'B',
      'p2': 'A'
    }
  }
]];
*/
/*var input = [[], [
  {
    'operation': 'implies',
    'p1': 'A',
    'p2': {
      'operation': 'implies',
      'p1': 'B',
      'p2': 'A'
    }
  }
]];*/
var input = [[
    {
      'operation': 'or',
      'p1': 'B',
      'p2': 'C'
    },
    {
      'operation': 'not',
      'p1': 'C'
    },
    {
      'operation': 'implies',
      'p1': 'B',
      'p2': {
        'operation': 'not',
        'p1': 'A'
      }
    }
  ], [
    {
      'operation': 'not',
      'p1': 'A'
    }
  ]
];
/*var input = [[], [
  {
    'operation': 'or',
    'p1': 'A',
    'p2': {
      'operation': 'not',
      'p1': 'A'
    }
  }
]];*/

reason(input);
