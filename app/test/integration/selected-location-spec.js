var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');
utils.extendBrowser(browser);

describe('Show information of a location', function() {

  before(function() {
    browser.getHomepage();
  });

  it('should show the locations layer', function() {
    element(by.linkText('L')).click();
  });
  
  it('should show information of a location', function() {
    element(by.css('[ng-click="select_random_location()"]')).click();
    browser.waitForAmount(element.all(by.css('#selected_location_controller table td.text-right')).first());
    element(by.css('#selected_location_controller button.btn.btn-default')).click();
  });

});
