var missingParameter = function(parr) {
  var i;
  var errorArray = [];
  for (i in parr) {
    var check = parr[i];
    if (!check.param) {
      errorArray.push(check.message);
    }
  }
  if (errorArray.length) {
    return {'error':true, 'messages':errorArray};
  }
  return false;
};

module.exports.missingParameter = missingParameter;
