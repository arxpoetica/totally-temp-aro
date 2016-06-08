var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Rename a route', function() {

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

  it('should rename the named route', function() {
    var new_name = 'My other name';
    element(by.css('#network_plan_menu > a')).click();
    element(by.css('[ng-click="save_as()"]')).click();
    element(by.css('#edit-route [ng-model="edit_route_name"]')).clear().sendKeys(new_name);
    element(by.css('#edit-route [ng-click="save_changes()"]')).click();

    browser.waitForText(element(by.css('.navbar-brand')), new_name);
  });
});
