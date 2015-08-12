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
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.btn.btn-default.navbar-btn')), name);
  });

  it('should delete the named route', function() {
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="show_routes()"]')).click();

    browser.waitForRepeaterToHaveData('route in routes');

    element(by.id('select-route')).all(by.css('td.ng-binding')).count().then(function(count) {
      element.all(by.css('[ng-click="delete_route(route)"]')).last().click();
      browser.confirmAlert();

      element(by.id('select-route')).all(by.css('td.ng-binding')).count().then(function(new_count) {
        expect(new_count).to.be.equal(count-1);
      });
    });
  });
});
