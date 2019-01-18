var login = require('./login')

describe('Create Plan layer', function() {
  it('creates a plan', function() {

    var newPlanName = 'PlanForTest' + Math.round(Math.random() * 10000)

    /** Create new plan **/

    browser.waitForVisible('//div[contains(@class, "tool-bar")]', 5000)

    if ($('//div[contains(@class, "tool-bar")]//button[@title="Save plan as..."]').isVisible()) {
      $('//div[contains(@class, "tool-bar")]//button[@title="Save plan as..."]').click()
    } else {
      $('//button[contains(@id, "dropdownMenu1")]').click()
      $('//ul[contains(@class, "dropdown-menu")]//li//button[@title="Save plan as..."]').click()
    }

    browser.waitForVisible('#searchPlanName', 5000)
    $('#searchPlanName').setValue(newPlanName) //set Plan Name

    //Select SA tag
    browser.waitForVisible('//div[contains(@id, "plan_inputs_modal")]/div/div/*/edit-plan-tag/div/div/*/input[@placeholder="Select Service Area..."]', 5000)
    $('//div[contains(@id, "plan_inputs_modal")]/div/div/*/edit-plan-tag/div/div/*/input[@placeholder="Select Service Area..."]').click()
    $('//div[contains(@id, "plan_inputs_modal")]/div/div/*/edit-plan-tag/div/div/ul').click()
    $('//div[contains(@id, "plan_inputs_modal")]/div/div/*/button[contains(text(), "Create Plan")]').click()

    browser.waitForVisible('//div[contains(@id, "header-bar-container")]/network-plan/div/div[contains(text(),' + newPlanName + ')]', 5000)    
  });
});