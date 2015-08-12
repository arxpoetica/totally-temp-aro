var chai = require('chai');
var expect = chai.expect;
require('./util').extendBrowser(browser);

describe.only('Rename a route', function() {

  before(function() {
    browser.get('http://localhost:8000');
  });
  
  it('should create a named route', function() {
    var name = 'My plan';
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.btn.btn-default.navbar-btn')), name);
  });

  it('should rename the named route', function() {
    var new_name = 'My other name';
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="save_as()"]')).click();
    element(by.css('#edit-route [ng-model="edit_route_name"]')).clear().sendKeys(new_name);
    element(by.css('#edit-route [ng-click="save_changes()"]')).click();

    browser.waitForText(element(by.css('.btn.btn-default.navbar-btn')), new_name);
  });
});
