var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Equipment node spec', function() {

  before(function() {
    browser.getHomepage();
  });
  
  it('should create a named route', function() {
    var name = 'My plan';
    element(by.css('[ng-click="new_route()"]')).click();
    element(by.css('input[ng-model="new_route_name"]')).clear().sendKeys(name);
    element(by.css('input[ng-model="new_route_area_name"]')).clear().sendKeys('Manhattan');
    element(by.css('[ng-click="look_up_area()"]')).click();
    element(by.css('[ng-click="save_new_route()"]')).click();
    browser.waitForText(element(by.css('.navbar-brand')), name);
  });

  it('should place a new equipment node', function() {
    element(by.linkText('ENT')).click();
    element(by.css('[ng-click="show_number_of_features()"]')).click();
    browser.waitForText(element(by.css('[ng-controller="equipment_nodes_controller"] .form-group span')), '1');
    element(by.css('[ng-click="place_random_equipment()"]')).click();
    element(by.css('[ng-click="show_number_of_features()"]')).click();
    browser.waitForText(element(by.css('[ng-controller="equipment_nodes_controller"] .form-group span')), '2');
  });

  it('should clear the nodes', function() {
    element(by.css('[ng-click="clear_nodes()"]')).click();
    browser.confirmAlert();
    element(by.css('[ng-click="show_number_of_features()"]')).click();
    browser.waitForText(element(by.css('[ng-controller="equipment_nodes_controller"] .form-group span')), '1');
  });

});
