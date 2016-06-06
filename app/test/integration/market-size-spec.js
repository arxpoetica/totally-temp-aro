var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Market size', function() {

  before(function() {
    browser.getHomepage();
  });
  
  it('should create a named route', function() {
    var name = 'My plan';
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('input[ng-model="new_route_area_name"]')).clear().sendKeys('Manhattan');
    element(by.css('[ng-click="lookUpArea()"]')).click();
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.navbar-brand')), name);
  });

  it('should show the market size modal window', function() {
    element(by.linkText('B')).click();
    element(by.css('#map_layers_toggle_census_blocks_layer input')).click();
    var elem = element(by.css('[ng-click="area_layers.census_blocks_layer.select_random_area()"]'));
    browser.waitForAttribute(elem, 'data-loaded', 'true');
    elem.click();

    // browser.waitForRepeaterToHaveData('row in total');
  });
});
