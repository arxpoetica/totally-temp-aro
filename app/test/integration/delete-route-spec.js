var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Delete a route', function() {

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

  it('should delete the named route', function() {
    element(by.css('#network_plan_menu a.dropdown-toggle')).click();
    element(by.css('#network_plan_menu a[ng-click="delete_route(route)"]')).click();
    browser.confirmAlert();
  });
});
