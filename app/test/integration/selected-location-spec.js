var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Show information of a location', function() {

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

  it('should show the locations layer', function() {
    element(by.linkText('L')).click();
  });
  
  it('should show information of a location', function() {
    element(by.css('[ng-click="select_random_location()"]')).click();
    browser.waitForAmount(element.all(by.css('#selected_location_controller table td.text-right')).first());
  });

});
