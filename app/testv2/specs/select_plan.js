var login = require('./login')
const assert = require('assert')

describe('Select a Plan', function() {
  it('select a plan', function() {

    // Log in to the system
    //browser.login(process.env.USER,process.env.PSWD)

    /* Select Existing plan */
    browser.waitForVisible('//div[contains(@class, "tool-bar")]', 5000)

    if ($('//div[contains(@class, "tool-bar")]//button[@title="Open an existing plan..."]').isVisible()) {
      $('//div[contains(@class, "tool-bar")]//button[@title="Open an existing plan..."]').click()
    } else {
      $('//button[contains(@id, "dropdownMenu1")]').click()
      $('//ul[contains(@class, "dropdown-menu")]//li//button[@title="Open an existing plan..."]').click()
    }

    //Select the first plan in the list
    browser.waitForVisible('//table[contains(@id, "tblSelectPlans")]', 5000)
    browser.waitForVisible('//table[contains(@id, "tblSelectPlans")]//tbody/tr[1]/td[1]', 5000)
    browser.waitForVisible('//table[contains(@id, "tblSelectPlans")]//tbody/tr[1]/td[1]/b/a', 5000)
    $('//table[contains(@id, "tblSelectPlans")]//tbody/tr[1]/td[1]/b/a').click()

    //Search for a plan in the table
    // var planToSearch = 'AddSB'
    // $('//plan-search/div/div[2]/div/div[1]/input').setValue(planToSearch) //set planname to search
    // browser.middleClick('//div[contains(@class, "tool-bar")]//button[@title="Global Settings..."]', 412, 200)
    // browser.waitForVisible('//table[contains(@id, "tblSelectPlans")]', 5000)
    // browser.waitForVisible('//table[contains(@id, "tblSelectPlans")]//tbody/descendant::td/b/a[contains(text(), ' + planToSearch + ')]', 10000)
    // $('//table[contains(@id, "tblSelectPlans")]//tbody/descendant::td/b/a[contains(text(), ' + planToSearch + ')]').click()

    console.log($('#selectedPlan').getText())
    //assert.equal($('#selectedPlan').getText(),planToSearch)
  });
});