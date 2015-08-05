var chai = require('chai');
var expect = chai.expect;

describe('ARO homepage', function() {

  before(function() {
    browser.get('http://localhost:8000');
  });
  
  it('should create a route', function(done) {
    element(by.css('[ng-click="toggle_tool_visibility()"]')).click();
    element(by.css('[ng-controller="shortest_path_controller"] [ng-click="create_route()"]')).click();

    var input = element(by.css('#shortest_path_controller [ng-model="route.name"]'));
    input.getAttribute('value').then(function(value) {
      expect(value).to.be.equal('Untitled route');

      // zoom
      element(by.css('[title="Zoom in"]')).click();
      element(by.css('[title="Zoom in"]')).click();
      done();
    });
  });

  it('should show a layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.wait(function() {
      return btn.getAttribute('data-loaded').then(function(value) {
        return value === 'true';
      })
    }, 10000);
  });

  it('should show the other layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.wait(function() {
      return btn.getAttribute('data-loaded').then(function(value) {
        return value === 'true';
      })
    }, 10000);
  });

  it('should select a few features', function(done) {
    element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.select_random_features()"]')).click();
    element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.select_random_features()"]')).click();

    element(by.id('shortest_path_total_cost')).getText().then(function(text) {
      var amount =  +text.replace(/[\$,\.]/g, '');
      expect(amount > 0).to.be.true;
      done();
    });
  });

});
