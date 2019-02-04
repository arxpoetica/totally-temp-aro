var login = require('./login')

describe('Run Optimization - Coverage Target', function() {
  it('creates and optimize a plan', function() {

    browser.waitForVisible('//div[contains(@class, "tool-bar")]', 10000)

    if ($('//div[contains(@class, "tool-bar")]//button[@title="Create a new plan"]').isVisible()) {
      $('//div[contains(@class, "tool-bar")]//button[@title="Create a new plan"]').click()
    } else {
      browser.waitForVisible('//button[contains(@id, "dropdownMenu1")]', 10000)
      $('//button[contains(@id, "dropdownMenu1")]').click()
      $('//ul[contains(@class, "dropdown-menu")]//li//button[@title="Create a new plan"]').click()
    }

    // if($('//div[contains(@class, "ui-note-noteline")]').isVisible()) {
    //   browser.waitForVisible($('//div[contains(@class, "ui-note-noteline")]'), 50000)
    //   //browser.waitUntil($('//div[contains(@class, "ui-note-noteline")]').getText() == 'rendering tiles', 50000)
    //   browser.waitUntil($('//div[contains(@class, "ui-note-noteline")]').getText() != 'rendering tiles', 50000)
    // }
    /* Select Locations */

    // Open Locations Model
    browser.waitForVisible('//*[@id="map_tools_toggle_locations"]', 10000)
    $('//*[@id="map_tools_toggle_locations"]').click()
    // Select households
    browser.waitForVisible('//div[contains(@id, "locations_controller")]/form/ul/li/div[contains(text(), "Residential")]/../div[contains(@class, "ctype-checkbox")]/input', 10000)
    if(!$('//div[contains(@id, "locations_controller")]/form/ul/li/div[contains(text(), "Residential")]/../div[contains(@class, "ctype-checkbox")]/input[contains(@checked,"checked")]').isVisible()) {
      $('//div[contains(@id, "locations_controller")]/form/ul/li/div[contains(text(), "Residential")]/../div[contains(@class, "ctype-checkbox")]/input').click()      
    }

    /* Select Service Area Boundaries */

    // Open Boundaries Model
    browser.waitForVisible('//*[@id="map_tools_toggle_boundaries"]', 10000)
    $('//*[@id="map_tools_toggle_boundaries"]').click()
    //Select Wirecenter
    browser.waitForVisible('//*[@id="map_layers_toggle_wirecenter"]/*/input', 10000)
    if (!$('//div[@id="map_layers_toggle_wirecenter"]/*/input[contains(@class,"ng-not-empty")]').isVisible()) {
      $('//*[@id="map_layers_toggle_wirecenter"]/*/input').click()
    }

    /* Select Analysis Mode */

    browser.waitForVisible('//display-mode-buttons//div[@title="Analysis Mode"]', 10000)
    $('//display-mode-buttons//div[@title="Analysis Mode"]').click()

    /* Select Hub Only Split Optimization type */
    browser.waitForVisible('//table[contains(@id, "tblNetworkAnalysisBuild")]', 5000)
    browser.waitForVisible('//table[contains(@id, "tblNetworkAnalysisBuild")]/tbody/descendant::td[contains(text(), "Optimization Type")]', 5000)
    $('//*[@id="tblNetworkAnalysisBuild"]/tbody[1]/descendant::td/select/option[@label="Coverage Target"]').click()
    browser.waitForVisible('//*[@id="coverageTargetValue"]', 5000)
    $('#coverageTargetValue').setValue(80)
    browser.waitForVisible('//table[contains(@id, "tblNetworkAnalysisBuild")]/tbody/descendant::td[contains(text(), "Network Construction")]', 5000)
    $('//*[@id="tblNetworkAnalysisBuild"]/tbody/descendant::td/select/option[@value="string:ODN_1"]').click()


    /* Click on tiles to select SA */
    browser.waitForVisible('//*[@id="map-canvas"]/div/div/div[1]/div[3]', 10000)
    $('//*[@id="map-canvas"]/div/div/div[1]/div[3]').click()

    /* Calculate Optimization */
    
    browser.waitForVisible('//div[contains(@class, "analysis-mode-container")]', 10000)
    
    if($('//div[contains(@class, "analysis-mode-container")]//i[@class="fa fa-bolt"]').isVisible()) {
      browser.waitForVisible('//div[contains(@class, "analysis-mode-container")]//i[@class="fa fa-bolt"]', 10000)
      $('//div[contains(@class, "analysis-mode-container")]//i[@class="fa fa-bolt"]').click()

      browser.waitForVisible('//optimize-button/button[contains(text(), "Modify")]', 50000)
    } else {
      browser.waitForVisible('//optimize-button/button[contains(text(), "Modify")]', 10000)
      $('//optimize-button/button[contains(text(), "Modify")]').click()
    }
    
  });
});