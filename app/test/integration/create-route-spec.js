var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Create a route', function() {

  before(function() {
    browser.getHomepage();
  });
  
  it('should create a route', function() {
    var name = 'My plan';
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('input[ng-model="new_route_area_name"]')).clear().sendKeys('Manhattan');
    element(by.css('[ng-click="look_up_area()"]')).click();
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.navbar-brand')), name);
  });

  it('should show a layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.waitForAttribute(btn, 'data-loaded', 'true');
  });

  it('should show the other layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.waitForAttribute(btn, 'data-loaded', 'true');
  });

  it('should select a few features', function() {
    element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.select_random_features()"]')).click();
    element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.select_random_features()"]')).click();

    browser.waitForAmount(element(by.id('shortest_path_total_cost')));
  });

  it('should export a route to KML', function(done) {
    element(by.css('#network_plan_menu > a')).click();
    element(by.css('[ng-click="export_kml_name()"]')).click();

    var fileName = "test-kml-export";
    element(by.css('input[ng-model="kml_file_name"]')).clear().sendKeys(fileName).then(function(){

      if(fs.existsSync(fileName + '.kml')){
        fs.unlinkSync(fileName + '.kml');
      }

      element(by.css('[ng-click="export_kml()"]')).click();

      // uncommenting this breaks the next test
      // fs.unlinkSync(fileName + '.kml');

      done();
    });
  });

  it('should clear a route', function() {
    element(by.css('#network_plan_menu > a')).click();
    element(by.css('[ng-click="clear_route()"]')).click();
    browser.confirmAlert();
    element(by.id('map_tools_toggle_route')).click();
    browser.waitForText(element(by.id('shortest_path_total_cost')), '$0.00');
  });

});
