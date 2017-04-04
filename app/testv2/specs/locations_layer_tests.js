describe('Locations layer', function() {
  it('creates and deletes a plan', function() {

    var newPlanName = 'PlanForTest' + Math.round(Math.random() * 10000)

    // Log in to the system
    browser.url('/login')
    $('#txtEmail').setValue('parag@metronconsulting.com')
    $('#txtPassword').setValue('parag')
    $('#btnLogin').click()

    // Open the "Create new plan" modal
    $('#btnNewPlan').click()
    browser.waitForVisible('#new-plan')

    // Set Plan name
    $('#txtNewPlanName').setValue(newPlanName)
    // Click on select2 and search for a location
    $('#s2id_txtNewPlanStartingLocation').click()
    $('#s2id_autogen2_search').setValue('Seattle, Washington')
    // Wait for the location to show up in the dropdown, then click it
    browser.waitForExist('//*[contains(text(), "Seattle, WA, USA")]')
    $('//*[contains(text(), "Seattle, WA, USA")]').click()
    // Create the plan
    $('#btnCreatePlan').click()

    // // Show the locations layer
    expect($('#map_tools_locations_panel_body').isVisible()).toBe(false)
    $('#map_tools_toggle_locations').click()
    browser.waitForVisible('#map_tools_locations_panel_body')



    // Go back to home page
    browser.url('/')

    // Click on "Existing Plans"
    $('#btnExistingPlans').click()
    browser.waitForVisible('#select-plan', 5000)

    // Click the delete button on the plan that we created
    $('//table[@id="tblSelectPlans"]/tbody/tr//*[contains(text(), "' +  newPlanName + '")]/../../td[3]/a[3]').click()
    // Click the button used to confirm plan deletion. The dialog should be shown and the button visible
    var xPathForDeleteConfirmation = '//div[contains(@class, "visible") and contains(@class, "showSweetAlert")]//button[contains(text(), "Yes, delete it!")]'
    browser.waitForVisible('//div[contains(@class, "visible") and contains(@class, "sweet-alert")]', 5000)
    $('//div[contains(@class, "visible") and contains(@class, "showSweetAlert")]//button[contains(text(), "Yes, delete it!")]').click()

  });
});

