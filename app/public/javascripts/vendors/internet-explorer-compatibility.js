// Fix missing NodeList.forEach() in Internet Explorer
// https://gist.github.com/bob-lee/e7520bfcdac266e5490f40c2759cc955
if ('NodeList' in window && !NodeList.prototype.forEach) {
  console.info('NodeList.forEach() does not exist. Using polyfill.');
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Fix missing String.startsWith() in Internet Explorer.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
if (!String.prototype.startsWith) {
  console.info('String.startsWith() does not exist. Using polyfill.')
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

// Fix missing Math.sinh/cosh() in Internet Explorer.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh
Math.sinh = Math.sinh || function(x) {
  var y = Math.exp(x);
  return (y - 1 / y) / 2;
}
Math.cosh = Math.cosh || function(x) {
  var y = Math.exp(x);
  return (y + 1 / y) / 2;
};