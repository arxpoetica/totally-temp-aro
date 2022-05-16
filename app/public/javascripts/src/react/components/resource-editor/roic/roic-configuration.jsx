import React from "react";

function ROICConfiguration(props) {
  const {
    handleConfigChange,
    handleBAUChange,
    terminalValueStrategyTypes,
    cashFlowStrategyTypes,
    roicManagerConfiguration,
    connectionCostStrategies,
    penetrationAnalysisStrategies
  } = props

  return (
    <div className="row">
      <div className="ei-items-contain">
        <div className="ei-foldout">
          <div className="ei-header" style={{ cursor: 'unset' }}>
            Financial Constraints
          </div>
          <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
            <div className="ei-items-contain">
              <div className="ei-property-item">
                <div className="ei-property-label">
                  Cash Flow Strategy Type
                </div>
                <div>
                  <select
                    name="cashFlowStrategyType"
                    className="form-control"
                    onChange={(event) => {handleConfigChange(event)}}
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration
                        .financialConstraints.cashFlowStrategyType
                    }
                  >
                    {Object.entries(cashFlowStrategyTypes).map(([itemKey, item]) => {
                      return (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      )}
                    )}
                  </select>
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Discount Rate
                </div>
                <div>
                  <input
                    name="discountRate"
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration
                        .financialConstraints.discountRate
                    }
                    onChange={(event) => {handleConfigChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Starting Year
                </div>
                <div>
                  <input
                    name="startYear"
                    value={roicManagerConfiguration.roicSettingsConfiguration.financialConstraints.startYear}
                    onChange={(event) => {handleConfigChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Years
                </div>
                <div>
                  <input
                    name="years"
                    value={roicManagerConfiguration.roicSettingsConfiguration.financialConstraints.years}
                    onChange={(event) => {handleConfigChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Penetration Analysis Strategy
                </div>
                <div>
                  <select
                    name="penetrationAnalysisStrategy"
                    className="form-control"
                    onChange={(event) => {handleConfigChange(event)}}
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration
                        .financialConstraints.penetrationAnalysisStrategy
                    }
                  >
                    {penetrationAnalysisStrategies.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Connection Cost Strategy
                </div>
                <div>
                  <select
                    name="connectionCostStrategy"
                    className="form-control"
                    onChange={(event) => {handleConfigChange(event)}}
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration
                        .financialConstraints.connectionCostStrategy
                    }
                  >
                    {connectionCostStrategies.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ei-property-item">
                <div className="ei-property-label">
                  Competition Provider Strength
                </div>
                <div>
                  <input
                    name="providerStrength"
                    value={
                      roicManagerConfiguration.roicSettingsConfiguration
                        .competitionConfiguration.providerStrength
                    }
                    onChange={(event) => {handleConfigChange(event)}}
                    className="form-control input-sm"
                  />
                </div>
              </div>

              <div className="ei-foldout">
                <div className="ei-header" style={{ cursor: 'unset' }}>
                  Terminal Value Strategy
                </div>
                <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
                  <div className="ei-items-contain">
                    <div className="ei-property-item">
                      <div className="ei-property-label">
                        Plan Terminal Value Type
                      </div>
                      <div>
                        <select
                          name="terminalValueStrategyType"
                          className="form-control"
                          onChange={(event) => {handleConfigChange(event)}}
                          value={
                            roicManagerConfiguration.roicSettingsConfiguration
                            .financialConstraints.terminalValueStrategy.terminalValueStrategyType
                          }
                        >
                          {Object.entries(terminalValueStrategyTypes).map(([itemKey, item]) => {
                            return (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            )}
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="ei-property-item">
                      <div className="ei-property-label">
                        Value
                      </div>
                      <div>
                        <input
                          name="value"
                          value={
                            roicManagerConfiguration.roicSettingsConfiguration
                            .financialConstraints.terminalValueStrategy.value
                          }
                          onChange={(event) => {handleConfigChange(event)}}
                          className="form-control input-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ei-items-contain">
                    <div className="ei-property-item">
                      <div className="ei-property-label">
                        BAU Terminal Value Type
                      </div>
                      <div>
                        <select
                          name="terminalValueStrategyType"
                          className="form-control"
                          onChange={(event) => {handleBAUChange(event)}}
                          value={
                            roicManagerConfiguration.roicSettingsConfiguration
                            .financialConstraints.bauTerminalValueStrategy.terminalValueStrategyType
                          }
                        >
                          {Object.entries(terminalValueStrategyTypes).map(([itemKey, item]) => {
                            return (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            )}
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="ei-property-item">
                      <div className="ei-property-label">
                        Value
                      </div>
                      <div>
                        <input
                          name="value"
                          value={
                            roicManagerConfiguration.roicSettingsConfiguration
                            .financialConstraints.bauTerminalValueStrategy.value
                          }
                          onChange={(event) => {handleBAUChange(event)}}
                          className="form-control input-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ROICConfiguration;