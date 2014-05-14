var util = require('./util');

var interpolate = function(value, data) {
  if (value == null || typeof value !== 'string') {
    throw new util.Error('interpolate_non_string', 'Can only interpolate strings but got value=' + value);
  }
  if (value.indexOf('{{') == -1) return value;
  var result = value,
      matches = util.uniq(value.match(/{{\s*[\w\._-]+\s*}}/g)),
      key = null,
      replaceValue = null;
  matches.forEach(function(match) {
    key = matches[0].slice(2, matches[0].length-2).trim(); // drop the double curlys, allow leading/trailing whitespace
    replaceValue = util.nestedValue(data, key);
    if (matches.length === 1 && matches[0].length === value.length) {
      // 1. If we matched the whole string, then replace it completely, possibly with a different type (i.e. object, number etc.)
      result = replaceValue;    
    } else {
      // 2. Otherwise - replace all occurences of regexp with data value toString
      result = util.replaceAll(match, (replaceValue || ''), result);
    }
  });
  return result === '' ? null : result;
};
exports.interpolate = interpolate;

var arrayMerge = function(array) {
  if (!util.isArray(array)) {
    throw new util.Error("array_merge_invalid_array", "Expected array argument but got " + array);
  }
  var result = {};
  array.forEach(function(hash) {
    if (!util.isObject(hash)) {
      throw new util.Error("array_merge_invalid_array", "Expected array to only contain objects but got " + hash);
    }
    result = util.deepMerge(result, hash);
  });
  return result;
};
exports.arrayMerge = arrayMerge;

var deepInterpolate = function(object, data) {
  var result = util.cloneDeep(object);
  util.each(object, function(value, key) {
    if (typeof value === 'string') {
      result[key] = interpolate(value, data);
    } else if (util.isObject(value)) {
      result[key] = deepInterpolate(value, data);
    }
  });
  return result;
};
exports.deepInterpolate = deepInterpolate;

var deepArrayMerge = function(object) {
  var result = util.cloneDeep(object);
  util.each(object, function(value, key) {
    if (util.isArray(value) && value.length > 0 && util.every(value, util.isObject)) {
      // FIXME: this assumes all arrays with objects should be merged to an object
      result[key] = arrayMerge(value);
    } else if (util.isObject(value)) {
      result[key] = deepArrayMerge(value);
    }
  });
  return result;  
};
exports.deepArrayMerge = deepArrayMerge;

// Return a fully expanded data representation of the API request with data variable interpolations and array merges
var parse = function(apiCall, data) {
  // FIXME: should we really do a double pass variable interpolation?
  return deepInterpolate(deepArrayMerge(deepInterpolate(apiCall, data)), data);
};
exports.parse = parse;

exports.run = function() {
  // TODO: make request with request client
  // TODO: make assertions
};