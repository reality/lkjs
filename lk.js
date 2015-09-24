var _ = require('underscore')._;

var isAxiom = function(input) {
  if(input[0].length == 1 && input[1].length == 1) {
    var a = input[0][0],
        b = input[1][0];

    if(_.isObject(a) && _.isObject(b) && a.operation == 'not' && b.operation == 'not') {
      a = a.p1;
      b = b.p1;
    }

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

  function(input) { // OL
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);

    if(element && element.operation == 'or') {

      var nFormula = [[ element.p2 ], right.splice(1) ];

      left.splice(-1,1,element.p1);

      console.log('OLRUN');
      console.log(input);
      console.log(nFormula);

      success = true;
    }

    return [ success, 'OL', input, nFormula ];
  },
  // turn B or C -> B,C into
  //  B -> B
  // C -> C

  // TODO: SPLIT RULES
  function(input) { // IL
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);

    if(element && element.operation == 'implies') {

      var nFormula = [[ element.p2 ], right.splice(0) ];

      right.push(element.p1);
      left.splice(-1);

      success = true;
    }

    return [ success, 'IL', input, nFormula ];
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
      right.splice(0, 0, element.p1);
      left.splice(-1);
      success = true;
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

      var nFormula = [ left.splice(-1) , [ right[0].p2 ]  ];
      nFormula[1] = nFormula[1].concat(right.splice(2));

      right.splice(0,1,element.p1);

      success = true;
    }

    return [ success, 'AR', input, nFormula ];
  },
  // turn B and C -> B,C into
  //  B -> B
  // C -> C

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
    console.log('YES BABY');
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

    if(right.length >= 2 && right[0] != right[1]) {
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
  var x = 0,
      formula = [ [ [ [ 'IN', input ] ] ] ], 
      solutionFound = false,
      nextTracks = [],
      trackCount = 1,
      formula;

  while(true) {
    nextTracks = [];
    x++;
    _.each(formula, function(track, i) {
      var currentStep = _.last(track);

      if(currentStep == false) {
        return false;
      }

      var solved = _.every(currentStep, function(subformula, o) {
        return isAxiom(subformula[1]);
      });

      if(solved) {
        solutionFound = track;
        return;
      }

      // Run the rulz
      var results = null;
      _.each(currentStep, function(subformula, y) {

        var answers;
        if(isAxiom(subformula[1])) {
          answers = [ [ subformula[0], subformula[1] ] ];
          // doing this
        } else {
          answers = applyRules(subformula[1]);
        }
        _.each(answers,function(a){
        });

        // each subformula ret
        if(results === null) {
          results = [];
          _.each(answers, function(r) {
            var a = [ [ r[0], r[1] ] ];

            if(r[2]) {
              a.push([ r[0], r[2] ])
            }

            results.push(a);
          });
        } else { // something braken here
          _.each(results, function(r) {
            _.each(answers, function(n) {
              r.push([ n[0], n[1] ]);
              if(n[2]) {
                r.push([ n[0], n[2] ]);
              }
            });
          }); // result permutations
        }
      });

      if(results.length == 0) {
        track.push(false);
        return;
      } else {
        _.each(results, function(r) {
          var newTrack = track.slice(),
              newStep = [];

          _.each(r, function(sf) {
            newStep.push([ sf[0], sf[1] ]);
          });

          newTrack.push(newStep);
          nextTracks.push(newTrack);
          trackCount++;
        });
      }
    });

    formula = nextTracks;

    console.log('Round ' + x + ' complete! Tracks: ');
    _.each(formula, function(track, i) {
      console.log('  Track ' + i);
      _.each(track, function(step, s) {
        console.log('    Step ' + s);
        _.each(step, function(val, z) {
          console.log('    Formula ' + z);
          console.log('      Operation: ' + val[0]);

          var prettified = [[],[]];

          _.each(val[1][0], function(op, i) {
            prettified[0][i] = prettyOperation(op); 
          });
          _.each(val[1][1], function(op, i) {
            prettified[1][i] = prettyOperation(op); 
          });
          
          console.log('      Value: ' + prettified[0].join(', ') + ' ⊢ ' + prettified[1].join(', '));
        });
      });
    });

    if(solutionFound) {
      console.log();

      console.log('SOLUTION FOUND ON STEP ' + x);

      console.log('Proof:')

      _.each(solutionFound, function(step, s) {
        console.log('    Step ' + s);
        _.each(step, function(val, z) {
          console.log('    Formula ' + z);
          console.log('      Operation: ' + val[0]);

          var prettified = [[],[]];

          _.each(val[1][0], function(op, i) {
            prettified[0][i] = prettyOperation(op); 
          });
          _.each(val[1][1], function(op, i) {
            prettified[1][i] = prettyOperation(op); 
          });
          
          console.log('      Value: ' + prettified[0].join(', ') + ' ⊢ ' + prettified[1].join(', '));
        });
      });


      console.log('Stats:');
      console.log('  Rounds: ' + x);
      console.log('  Tracks: ' + trackCount);

      break;
    }
  }
};

var input = [ [], [
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

/*var input = [ [], [ {
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
]];*/
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
/*var input = [[
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


