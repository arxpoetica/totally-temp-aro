import React from "react";

function ROICSubsidy(props) {
  const {
    handleSubsidyChange,
    roicManagerConfiguration,
    isCalculationSetting,
    calculationTypes
  } = props

  return (
    <div className="row" style={{ marginBottom: "8%"}}>
      <div className="ei-items-contain">
        <div className="ei-foldout">
          <div className="ei-header" style={{ cursor: 'unset' }}>
            Subsidy Configuration
          </div>
          <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
            <div className="ei-items-contain">
              <div className="ei-property-item">
                <div className="ei-property-label">
                  Calculation Setting
                </div>
                <form>
                  Use Location Layer
                  <input
                    type="radio"
                    name="pruningCoverageTypes"
                    value="SUBSIDIZED"
                    checked={isCalculationSetting("SUBSIDIZED")}
                    onChange={(event) => handleSubsidyChange(event)}
                  /><br />
                  Use Dynamic Calculation
                  <input
                    type="radio"
                    name="pruningCoverageTypes"
                    value="ELIGIBLE"
                    checked={isCalculationSetting("ELIGIBLE")}
                    onChange={(event) => handleSubsidyChange(event)}
                  /><br />
                  Use Both
                  <input
                    type="radio"
                    name="pruningCoverageTypes"
                    value="BOTH"
                    checked={isCalculationSetting("BOTH")}
                    onChange={(event) => handleSubsidyChange(event)}
                  />
                </form>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Calculation Type
                </div>
                <div>
                <select
                    name="calcType"
                    className="form-control"
                    onChange={(event) => {handleSubsidyChange(event)}}
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration
                        .calcType
                    }
                  >
                    {calculationTypes.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Value (IRR and Percent in decimal | Fixed in Int)
                </div>
                <div>
                  <input
                    name="value"
                    value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.value}
                    onChange={(event) => {handleSubsidyChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Subsidy Range
                </div>
                <div>
                  Min
                  <input
                    name="minValue"
                    value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.minValue}
                    onChange={(event) => {handleSubsidyChange(event)}}
                    className="form-control input-sm"
                  />
                  Max
                  <input
                    name="maxValue"
                    value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.maxValue}
                    onChange={(event) => {handleSubsidyChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ROICSubsidy;