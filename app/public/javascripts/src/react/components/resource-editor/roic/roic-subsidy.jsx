import React from "react";
import { Switch, Radio, Select, NumberInput } from "@mantine/core"

const coverageTypes = Object.freeze({
  SUBSIDIZED: 'Use Location layer',
  ELIGIBLE: 'Use Dynamic Calculation',
  BOTH: 'Use Both | (Location Layer Default)'
})

function ROICSubsidy(props) {
  const {
    handleSubsidyChange,
    roicManagerConfiguration,
    calculationTypes
  } = props

  const calcButtonLabel = (calcType) => {
    const [label, labelDescription] = coverageTypes[calcType].split('|')

    return (
      <span className="radio-label">
        { label }
        { labelDescription && (
          <span className="radio-description">
            { labelDescription }
          </span>
        )}
      </span>
    )
  }

  const subsidyConfiguration = () => roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration

  const isCalculationSetting = () => {
    const coverageTypes = subsidyConfiguration().pruningCoverageTypes
    return coverageTypes.length > 1 ? "BOTH" : coverageTypes[0];
  }

  const isSubsidyDisabled = () => {
    return !subsidyConfiguration().pruningCoverageTypes.length
  }

  const isLocationLayerCoverage = () => {
    const subsidyConfig = subsidyConfiguration()
    return subsidyConfig.pruningCoverageTypes[0] == "SUBSIDIZED" && subsidyConfig.pruningCoverageTypes.length === 1
  }

  const isFixedCalcType = () => {
    return subsidyConfiguration().calcType == "FIXED"
  }

  const isCalcTypeDisabled = () => {
    return isLocationLayerCoverage() || isSubsidyDisabled()
  }

  const isValueDisabled = () => {
    return isCalcTypeDisabled()
  }

  const isRangeDisabled = () => {
    return isCalcTypeDisabled() || isFixedCalcType()
  }

  const parseNumber = (value) => {
    return !Number.isNaN(parseFloat(value))
      ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : ''
  }

  const parseValue = () => {
    // If number is a decimal display it as a whole number. eg:
    // database: .2 -> user display: 20%
    let stringValue = subsidyConfiguration().value
    const toNumber = Number(stringValue)
    if(!Number.isInteger(toNumber) && toNumber < 1) {
      const multiplier = Math.pow(10, 2);
      stringValue = stringValue * 100
      stringValue = Math.round(stringValue * multiplier) / multiplier;
    }

    return parseNumber(stringValue)
  }
  
  return (
    <div className="roic-subsidy-container" style={{ marginBottom: "8%"}}>
      <div className="subsidy-header">
        <div className="subsidy-left-header">
          <div className="subsidy-icon" />
          <div className="subsidy-header-text">
            <div className="subsidy-header-title">
              Subsidies
            </div>
            <div className="subsidy-header-description">
              Control how a subsidy is calculated by location.
            </div>
          </div>
        </div>
        <Switch
          name="disableSubsidy"
          label="enabled"
          classNames={{
            root: 'switch-root',
            label: 'switch-label'
          }}
          checked={!isSubsidyDisabled()}
          onChange={(event) => handleSubsidyChange(event, 'disableAll')}
        />
      </div>
      <div className="subsidy-body">
        <Radio.Group
          name="pruningCoverageTypes"
          label="Calculation Setting"
          description="Choose How the subsidy is calculated per location."
          classNames={{
            label: 'calc-label',
            description: 'calc-description',
            root: 'calc-root'
          }}
          value={isCalculationSetting()}
          onChange={(event) => handleSubsidyChange(event, 'pruningCoverageTypes')}
          disabled={isSubsidyDisabled()}
          >
          {Object.keys(coverageTypes).map(coverageType => 
            <Radio
              key={coverageType}
              value={coverageType}
              label={calcButtonLabel(coverageType)}
            />
          )}
        </Radio.Group>
        <div className="input-wrapper">
          <div className="calc-type-value-wrapper">
            <Select
              label="Calculation Type"
              data={
                calculationTypes.map(item => {
                  return { value: item.id, label: item.label }
                })
              }
              classNames={{
                root: 'select-root',
                label: 'select-label'
              }}
              name="calcType"
              onChange={(event) => handleSubsidyChange(event, 'calcType')}
              value={subsidyConfiguration().calcType}
              disabled={isCalcTypeDisabled()}
            />
            <NumberInput
              classNames={{
                rightSection: 'value-right-section',
                root: 'value-root',
                label: 'value-label'
              }}
              label="Value"
              icon={isFixedCalcType() && "$"}
              rightSection={!isFixedCalcType() && "%"}
              value={subsidyConfiguration().value}
              onChange={(value) => handleSubsidyChange(value, 'value')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              formatter={() => parseValue()}
              disabled={isValueDisabled()}
              hideControls
              />
          </div>
          <div className="subsidy-range">
            <span className="range-title"> Subsidy Range </span>
            <div className="range-inputs">
              <NumberInput
                classNames={{ root: 'number-input-root range-item' }}
                icon="$"
                value={subsidyConfiguration().minValue}
                onChange={(value) => handleSubsidyChange(value, 'minValue')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                formatter={(value) => parseNumber(value)}
                disabled={isRangeDisabled()}
                hideControls
                />
              <span className="range-item">to</span>
              <NumberInput
                classNames={{ root: 'number-input-root range-item' }}
                icon="$"
                value={subsidyConfiguration().maxValue}
                onChange={(value) => handleSubsidyChange(value, 'maxValue')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                formatter={(value) => parseNumber(value)}
                disabled={isRangeDisabled()}
                hideControls
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .roic-subsidy-container :global(.text-input-root) {
          width: 45%;
        }
        .roic-subsidy-container :global(.select-root) {
          width: 30%;
          margin-right: 10%;
        }
        .roic-subsidy-container :global(.select-label) {
          font-size: 16px;
          font-weight: 600;
          line-height: 25px;
        }
        .roic-subsidy-container :global(.switch-root) {
          flex-direction: row-reverse;
          width: 30%;
        }
        .roic-subsidy-container :global(.switch-label) {
          margin-right: 6%;
          margin-bottom: 1%;
          font-weight: 600;
          font-size: 12px;
          line-height: 16px;
        }
        .roic-subsidy-container :global(.calc-root) {
          margin: 2%;
        }
        .roic-subsidy-container :global(div.calc-label) {
          font-size: 18px;
          font-weight: 600;
          line-height: 25px;
        }
        .roic-subsidy-container :global(.calc-description) {
          font-size: 16px !important;
          font-weight: 400;
          line-height: 22px;
        }
        .roic-subsidy-container :global(.radio-label) {
          font-weight: 600;
          font-size: 16px;
          line-height: 22px;
        }
        .roic-subsidy-container :global(.radio-description) {
          font-size: 14px;
          font-weight: 400
        }
        .roic-subsidy-container :global(.value-right-section) {
          color: #CED4DA;
        }
        .roic-subsidy-container :global(.value-label) {
          font-size: 16px;
          font-weight: 600;
          line-height: 25px
        }
        .roic-subsidy-container :global(.value-root) {
          width: 15%;
        }
        .roic-subsidy-container {
          background: #FFFFFF;
          font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
        }
        .subsidy-header {
          display: flex;
          border-bottom: 1px solid #E5E5E5;
          margin: 2%;
          justify-content: space-between;
        }
        .subsidy-left-header {
          display: flex;
          width: 60%;
        }
        .subsidy-header-text {
          display: flex;
          flex-direction: column;
          width: 70%;
          padding-bottom: 2%;
        }
        .subsidy-icon {
          background: none no-repeat center transparent;
          width: 30px;
          height: 30px;
          margin-left: 2%;
          margin-top: .5%;
          margin-right: 1%;
          background-image: url('/svg/roic-subsidies.svg');
        }
        .subsidy-header-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px
        }
        .subsidy-header-description {
          font-size: 14px;
          font-weight: 400;
          line-height: 19px;
        }
        .calc-type-value-wrapper {
          display: flex;
          margin-bottom: 3%;
        }
        .subsidy-range {
          display: flex;
          flex-direction: column;
        }
        .range-inputs {
          display: flex;
          width: fit-content;
          align-items: baseline;
        }
        .range-item {
          margin-right: 2%;
          word-break: normal;
          margin-left: 2%;
        }
        .range-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 25px;
          color: #212529;
          margin-bottom: 4px;
          -webkit-tap-highlight-color: transparent;
        }
        .input-wrapper {
          display: flex;
          flex-direction: column;
          margin-left: 2%;
          margin-bottom: 5%;
        }
        @media screen and (max-width: 1500px) {
          .roic-subsidy-container :global(.value-root) {
            width: 20%;
          }
        }
      `}</style>
    </div>
  );
}
export default ROICSubsidy;