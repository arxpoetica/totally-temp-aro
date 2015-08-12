var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');

describe('ARO homepage', function() {

  before(function() {
    browser.get('http://localhost:8000');
  });
  
  it('should create a route', function(done) {
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="new_route()"]')).click();

    element(by.css('[ng-click="save_new_route()"]')).click();

    var input = element(by.css('#shortest_path_controller [ng-model="route.name"]'));
    input.getAttribute('value').then(function(value) {
      expect(value).to.be.equal('Untitled plan');

      // zoom
      element(by.css('[title="Zoom in"]')).click();
      element(by.css('[title="Zoom in"]')).click();
      done();
    });
  });

  it('should show a layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.wait(function() {
      return btn.getAttribute('data-loaded').then(function(value) {
        return value === 'true';
      })
    }, 10000);
  });

  it('should show the other layer', function() {
    var btn = element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.toggle_visibility()"]'));
    btn.click();
    browser.wait(function() {
      return btn.getAttribute('data-loaded').then(function(value) {
        return value === 'true';
      })
    }, 10000);
  });

  it('should select a few features', function(done) {
    element(by.repeater('(key, layer) in feature_layers').row(0)).element(by.css('[ng-click="layer.select_random_features()"]')).click();
    element(by.repeater('(key, layer) in feature_layers').row(1)).element(by.css('[ng-click="layer.select_random_features()"]')).click();

    element(by.id('shortest_path_total_cost')).getText().then(function(text) {
      var amount =  +text.replace(/[\$,\.]/g, '');
      expect(amount > 0).to.be.true;
      done();
    });
  });

  it('should export a route to KML', function(done) {
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="export_kml_name()"]')).click();

    var fileName = "./e2e/downloads/test-kml-export";
    element(by.css('input[ng-model="kml_file_name"]')).clear().sendKeys(fileName).then(function(){

      if(fs.existsSync(fileName + '.kml')){
        fs.unlinkSync(fileName + '.kml');
      }

      element(by.css('[ng-click="export_kml()"]')).click();

      browser.driver.wait(function(){

        return fs.existsSync(fileName + '.kml');
      }, 30000).then(function(){

        console.log('file exists');
        fs.unlinkSync(fileName + '.kml');
        
        done();
      })


    });
  });

  it('should clear a route', function(done) {
    element(by.css('#network_plans_menu > li > a')).click();
    element(by.css('[ng-click="clear_route()"]')).click();

    browser.sleep(500);
    element(by.css('button.confirm')).click().then(function(){

      element(by.id('shortest_path_total_cost')).getText().then(function(text) {
        expect(text == '').to.be.true;
        done();
      });

    });
  });



});
