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

var formulaeEquals = function(a, b) {
  // A set of two formulae forming a step of a track
  var different = false;
  console.log('trying to compare ' + a + ' and ' + b);

  _.each(a[1], function(sf, x) {
    var bsf = b[1];
    console.log('got ' + a[1]);
    _.each(sf, function(li, y) {
      if(prettyOperation(li) != prettyOperation(bsf[0][y])) {
        console.log('comparing ' + prettyOperation(li) + ' ' + prettyOperation(bsf[y]));
        different = true;
      }
    }); 
  });

  _.each(a[2], function(sf, x) {
    var bsf = b[2];
    console.log('got ' + a[1]);
    _.each(sf, function(li, y) {
      if(prettyOperation(li) != prettyOperation(bsf[0][y])) {
        console.log('comparing ' + prettyOperation(li) + ' ' + prettyOperation(bsf[y]));
        different = true;
      }
    }); 
  });

  return different == false;
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

      var formulaeOne = [],
          formulaeTwo = [],
          formulaOneEnd = element.p1,
          formulaTwoEnd = element.p2;

      // Cut the OR out of the input 
      left.splice(-1);

      if(left.length > 0) {
        for(var i=0;i<left.length+1;i++) {
          var thisLeftOne = left.slice(0, i);
              thisLeftTwo = left.slice(i);

          thisLeftOne.push(formulaOneEnd)
          thisLeftTwo.push(formulaTwoEnd)

          for(var y=0;y<right.length+1;y++) {
            var thisRightOne = right.slice(0, y);
            var thisRightTwo = right.slice(y);

            formulaeOne.push([ thisLeftOne, thisRightOne ]);
            formulaeTwo.push([ thisLeftTwo, thisRightTwo ]);
          }
        }
      } else { // there is probably a better way to do this but it's 1am stop me
        for(var y=0;y<right.length+1;y++) {
          var thisRightOne = right.slice(0, y);
          var thisRightTwo = right.slice(y);

          formulaeOne.push([ [ formulaOneEnd ], thisRightOne ]);
          formulaeTwo.push([ [ formulaTwoEnd ], thisRightTwo ]);
        }
      }

      success = formulaeOne.length;
      //console.log('OL ' + success);
    }

    return [ success, 'OL', formulaeOne, formulaeTwo ];
  },
//  Track 0
//    Step 0
//    Formula 0
//      Operation: IN
//      Value: B ∨ C ⊢ B, C
 //   Step 1
  //  Formula 0
 //     Operation: OL
 //     Value:  ⊢ B
 ///   Formula 1
  //    Operation: OL
 //     Value: C, B ⊢ C

  // turn B or C -> B,C into
  //  B -> B
  // C -> C

  function(input) { // IL
    var left = input[0],
        right = input[1],
        success = false,
        element = _.last(left);

    if(element && element.operation == 'implies') {

      var formulaeOne = [],
          formulaeTwo = [],
          formulaOneStart = element.p1,
          formulaTwoEnd = element.p2;

      // Cut the implies out of the input 
      left.splice(-1);
      //console.log('left before');
      //console.log(left);

      if(left.length > 0) {
        for(var i=0;i<left.length+1;i++) {
          var thisLeftOne = left.slice(0, i);
              thisLeftTwo = left.slice(i);

          thisLeftTwo.push(formulaTwoEnd)

          for(var y=0;y<right.length+1;y++) {
            var thisRightOne = right.slice(0, y)
            var thisRightTwo = right.slice(y);

            thisRightOne.splice(0, 0, formulaOneStart);

            formulaeOne.push([ thisLeftOne, thisRightOne ]);
            formulaeTwo.push([ thisLeftTwo, thisRightTwo ]);
            //console.log('f2 with left ' + i + ' right ' + y);
            //console.log([ thisLeftTwo, thisRightTwo ]);
          }
        }
      } else { // there is probably a better way to do this but it's 1am stop me
        for(var y=0;y<right.length+1;y++) {
          var thisRightOne = [formulaOneStart].concat(right.slice(0, y));
          var thisRightTwo = right.slice(y);

          formulaeOne.push([ [ ], thisRightOne ]);
          formulaeTwo.push([ [ formulaTwoEnd ], thisRightTwo ]);
        }
      }

      success = formulaeOne.length;
    }

    return [ success, 'IL', formulaeOne, formulaeTwo ];
  },
  // here we must check every way of splitting the other inputs
  /*Here we should turn e.g.
  (b or c), not c, (b implies (not a)) -> (not a)
  into 
    b or c, (not c) -> b
    (not a) -> (not a)*/
  /*
    Value: B ∨ C, ¬C, B → (¬A) ⊢ ¬A

    Formula 0
      Operation: IL
      Value: B ∨ C ⊢ B
    Formula 1
      Operation: IL
      Value: ¬A, ¬C ⊢
*/

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

    if(output[0] === true) { // Success
      results.push([ output[1], output[2], output[3] ]);
    } else if(_.isNumber(output[0]) && output[0] > 1) {
      _.each(output[2], function(f, y) {
        results.push([ output[1], output[2][y], output[3][y] ]);
      });
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
      oLength = input.length;

  while(true) {
    nextTracks = [];
    x++;

    _.each(formula, function(track, i) {
      var currentStep = _.last(track);

      if(currentStep == 'no' || currentStep == false) {
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
          answers = [[ subformula[0], subformula[1] ]];
          // doing this
        } else {
          answers = applyRules(subformula[1]);
        }

        var lastInstruction = subformula[0];
        answers = _.filter(answers, function(a, y) {
          if(lastInstruction == 'CR' && a[0] == 'WR') {
            return false;
          } else if(lastInstruction == 'CL' && a[0] == 'WL') {
            return false;
          } else {
            return true;
          }
        });
        console.log('last: ' + subformula[0]);

        // each subformula ret
        if(results === null) {
          results = [];
          _.each(answers, function(r, z) {
            var a = [[ r[0], r[1] ]];

            if(r[2]) {
              a.push([ r[0], r[2] ]);
            }

            results.push(a);
          });
        } else { // If we already have some results for this track, then add a subformula to each of them
          var newResults = [];

          _.each(results, function(r, o) {

            _.each(answers, function(n, z) {
              var newResult = r.slice(0);

              newResult.push([ n[0], n[1] ])

              if(n[2]) {
                newResult.push([ n[0], n[2] ]);
              }

              newResults.push(newResult);

            });

          }); // result permutations

          results = newResults;
        }

      });

      _.each(results, function(r, o) {
        var newTrack = track.slice(),
            newStep = [],
            dead = false;

        _.each(r, function(sf, z) {
          if(sf[1][0].length == 0 && sf[1][1].length == 0 || (sf[1][0].length + sf[1][1].length) == 1 || (sf[1][0].length + sf[1][1].length) >= oLength + 10) {
            dead = true;
          }
          newStep.push([ sf[0], sf[1] ]);
        });
       
        if(!dead) {
          newTrack.push(newStep);
          nextTracks.push(newTrack);
        }

        trackCount++;
      });

      // stop evaluating this track
      track.push('no');
    });

    formula = nextTracks;

    console.log('Round ' + x + ' complete! Tracks: ' + formula.length);
    /*_.each(formula, function(track, i) {
        console.log('  Track ' + i);
        _.each(track, function(step, s) {
          console.log('    Step ' + s);
          if(step=='no') return;
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
      });*/

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

    if(x==4) break;
  }
};

// B ∨ C ⊢ ((B → (¬A)) ∧ (¬C)) → (¬A)
/*
var input = [[
  {
    'operation': 'or', 
    'p1': 'B',
    'p2': 'C'
  },
  ],[
  {
      'operation': 'implies',
      'p1': {
        'operation': 'and',
        'p1': {
          'operation': 'implies',
          'p1': 'B',
          'p2': {
            'operation': 'not',
            'p1': 'A'
          }
        },
        'p2': {
          'operation': 'not',
          'p1': 'C'
        }
      },
      'p2': {
        'operation': 'not',
        'p1': 'A'
      }
  }
  ]
];*/
/*
var input = [[], [
  {
    'operation': 'implies',
    'p1': {
      'operation': 'implies',
      'p1': 'A',
      'p2': {
        'operation': 'or', 
        'p1': 'B',
        'p2': 'C'
      }
    },
    'p2': {
      'operation': 'implies',
      'p1': {
        'operation': 'and',
        'p1': {
          'operation': 'implies',
          'p1': 'B',
          'p2': {
            'operation': 'not',
            'p1': 'A'
          }
        },
        'p2': {
          'operation': 'not',
          'p1': 'C'
        }
      },
      'p2': {
        'operation': 'not',
        'p1': 'A'
      }
    }
  }
]];
/*
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
]];*/
// hilbert 3
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

//B or C -> B,C
/*var input = [[
  'A', 'B', 'C', 'D',
  {
    'operation': 'or',
    'p1': 'B',
    'p2': 'C'
  }], [
    'B', 'C', 'D'
]];*/
/*var input = [[
  'A', 'B'
  ], [
  'A', 'B', 'C' 
]];*/


  //(b or c), not c, (b implies (not a)) -> (not a)
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
 ],
 [
    {
      'operation': 'not',
      'p1': 'A'
    }
 ]];


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
];*/
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


