var timeout = 10000;

exports.extendBrowser = function(browser) {

  browser.getHomepage = function() {
    browser.get('http://localhost:8000');
  };

  browser.waitForAttribute = function(elem, name, value) {
    browser.wait(function() {
      return elem.getAttribute(name).then(function(val) {
        return val === value;
      })
    }, timeout);
  };

  browser.waitForText = function(elem, value) {
    browser.wait(function() {
      return elem.getText().then(function(val) {
        return val === value;
      })
    }, timeout);
  };

  browser.waitToBeDisplayed = function(elem) {
    browser.wait(function() {
      return elem.isDisplayed().then(function(val) {
        return val;
      });
    }, timeout);
  };

  browser.waitForClass = function(elem, clazz) {
    browser.wait(function() {
      return elem.getAttribute('class').then(function(val) {
        return val.split(/\s+/).indexOf(clazz) >= 0;
      })
    }, timeout);
  };

  browser.confirmAlert = function() {
    browser.waitForClass(element(by.css('.sweet-alert')), 'visible');
    element(by.css('.sweet-alert button.confirm')).click();
  };

  browser.waitForAmount = function(elem) {
    browser.wait(function() {
      return elem.getText().then(function(text) {
        var amount = +text.replace(/[\$,\.]/g, '');
        return amount || amount === 0;
      })
    }, timeout);
  };

  browser.waitForRepeaterToHaveData = function(repeater) {
    browser.wait(function(){
      return element.all(by.repeater(repeater)).then(function(arr) {
        return arr.length > 0;
      })
    }, timeout);
  };

};

var findByText = function() {
  var using = arguments[0] || document;
  var text = arguments[1];
  var matches = [];
  function addMatchingLeaves(element) {
    if (element.children.length === 0 && element.textContent.match(text)) {
      matches.push(element);
    }
    for (var i = 0; i < element.children.length; ++i) {
      addMatchingLeaves(element.children[i]);
    }
  }
  addMatchingLeaves(using);
  return matches;
};

by.addLocator('text', findByText);
