var chai = require('chai');
var expect = chai.expect;

describe('ARO homepage', function() {

  before(function() {
    browser.get('http://localhost:8000');
  });
  
  it('should create a named route', function(done) {

    element(by.id('map_tools_toggle_route')).click();
    element(by.css('[ng-controller="shortest_path_controller"] [ng-click="create_route()"]')).click();
    element(by.css('input[ng-model="route.name"]')).clear().sendKeys("test-delete-route").then(function(text){

      element(by.css('[ng-controller="shortest_path_controller"] [ng-click="save_changes()"]')).click().then(function(){

        browser.get('http://localhost:8000');
        element(by.id('map_tools_toggle_route')).click();

        browser.wait(function(){
          return element.all(by.repeater('route in routes')).then(function(routes){
            return routes.length > 0;
          })
        }, 10000);

        element.all(by.repeater('route in routes')).all(by.cssContainingText('td.ng-binding', 'test-delete-route')).then(function(routes){

          expect(routes).to.have.length(1);
        });

        done();
      });
    });
  });


  it('should delete the named route', function() {

    browser.wait(function(){
      return element.all(by.repeater('route in routes')).then(function(routes){
        return routes.length > 0;
      })
    }, 10000);

    element.all(by.css('td.ng-binding')).filter(function(routes){
      return routes.getText().then(function(text){
        return text == "test-delete-route";
      });
    }).then(function(elems){
      elems[0].element(by.xpath('following-sibling::td/a[@ng-click="delete_route(route)"]')).click();
    })

    browser.sleep(1000);

    element(by.css('button.confirm')).click().then(function(){

      element.all(by.repeater('route in routes')).all(by.cssContainingText('td.ng-binding', 'test-delete-route')).then(function(newRoutes){

        expect(newRoutes).to.have.length(0);
      });
    });
  });
});
