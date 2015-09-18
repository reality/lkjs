var _ = require('underscore')._;

var term = /[A-Z]/,
    or = /∨/;

// Negate a term
var negate = function(term) {
  return term.indexOf('¬') == 0 ? term.slice(1) : '¬' + term;
};

var inferenceRules = {
  'left': [

  ],
  'right': [
    function(input) { // AR1
      var left = input[0],
          right = input[1];

      if(right[0].match(term) && right[1].match(or) && right[2].match(term)) {
        right.splice(1, 2);
      }
      return input;
    },

    function(input) { // AR1
      var left = input[0],
          right = input[1];

      if(right[0].match(term) && right[1].match(or) && right[2].match(term)) {
        right.splice(0, 2);
      }
      return input;
    },

    function(input) { // IR
      var left = input[0],
          right = input[1];

      if(right[0].match(term) && right[1].match(implies) && right[2].match(term)) {
        left.push(right[0]);
        right.splice(0, 2);
      }
      return input;
    },

    function(input) { // NR
      var left = input[0],
          right = input[1];

      if(right[0].match(nterm)) {
        left.push(negate(right[0]));
        right.splice(0, 1);
      }
      return input;
    }
  ]
};

var infer = function(input) {
  console.log(input);

  if(input.match(/A=>A/)) {
    return true;
  } else {
    var rules = _.filter(inferenceRules, function(rule) {
      return input.match(rule.input);
    });

    if(rules.length > 0) {
      console.log('Applying ' + rules[0].name);
      return infer(input.replace(rules[0].input, rules[0].output));
    } else {
      return false;
    }
  }
};

// Each array symbolises its respective side of the sequent ⇒
var input = [[], ['A', '∨', '¬A']];

console.log(infer(input));
