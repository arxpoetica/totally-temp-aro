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
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.btn.btn-default.navbar-btn')), name);
  });

  it('should show the census blocks layer', function() {
    var btn = element(by.linkText('CB'));
    btn.click();
    browser.waitForAttribute(btn, 'data-loaded', 'true');

    element(by.linkText('MS')).click();
    element(by.css('#map_layers_toggle_census_blocks_layer [ng-click="layer.select_random_area()"]')).click();

    browser.waitForRepeaterToHaveData('row in total');
  });
});
