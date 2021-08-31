import React, { Component } from 'react'
import { connect } from 'react-redux'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const intlNumberFormat = config.intl_number_format || 'en-US'
const currencyCode = config.currency_code || 'USD'
const currencyFormatter = new Intl.NumberFormat(intlNumberFormat, {
  style: 'currency',
  currency: currencyCode,
  minimumFractionDigits: 1
})
const numberFormatter = new Intl.NumberFormat(intlNumberFormat)

export class RoicReportsSummary extends Component {
  constructor (props) {
    super(props)

    this.config = config

    this.state = {
      FIBER_STRINGS: this.props.enumStrings['com.altvil.aro.service.entity']['FiberType'],
      CABLE_CONSTRUCTION_STRINGS: this.props.enumStrings['com.altvil.interfaces']['CableConstructionEnum'],
    }
  }

  render () {
    return Object.keys(this.props.networkNodeTypesEntity).length === 0 ? null : this.renderRoicReportsSummary()
  }

  renderRoicReportsSummary () {

    const { roicResults, networkEquipment, networkNodeTypesEntity } = this.props
    const { FIBER_STRINGS, CABLE_CONSTRUCTION_STRINGS } = this.state

    return (
      <div>
        <table id="tblNetworkBuildOutput" className="table table-sm table-striped">
          <tbody>
            {roicResults.networkStatistics && roicResults.networkStatistics.map((networkStatistic, index) => {
              return (
                networkStatistic.networkStatisticType === 'roic_npv' &&
                <tr key={index}>
                  <td>
                    {networkStatistic.networkStatisticType === 'roic_npv' &&
                      <strong>NPV</strong>
                    }
                  </td>
                  <td>
                    {networkStatistic.networkStatisticType === 'roic_npv' &&
                      currencyFormatter.format((networkStatistic.value / 1000).toFixed(1)) + ' K'
                    }
                  </td>
                </tr>
              )}
            )}

            {roicResults.networkStatistics && roicResults.networkStatistics.map((networkStatistic, index) => {
              return (
                networkStatistic.networkStatisticType === 'roic_irr' &&
                <tr key={index}>
                  <td>
                    {networkStatistic.networkStatisticType === 'roic_irr' &&
                      <strong>IRR</strong>
                    }
                  </td>
                  <td>
                    {networkStatistic.networkStatisticType === 'roic_irr' &&
                      (networkStatistic.value * 100).toFixed(1) + ' %'
                    }
                  </td>
                </tr>
              )}
            )}

            <tr>
              <td><strong>Total Capex</strong></td>
              <td>{roicResults.priceModel && currencyFormatter.format((roicResults.priceModel.totalCost / 1000).toFixed(1)) + ' K'}</td>
            </tr>

            <tr>
              {/* Capex per premises is being calculated as Total Capex in $s
              divided by number of premises in year 0.
              No. of premises varies according to selected Network type and Entity type
              that's why Capex Per Premises is fixed with their default values */}
              {/* Note to self: singular of premises is premises, not premise */}
              <td className='roic-report-field-title'>Capex Per Premises</td>
              <td>{roicResults.priceModel
              && 'PLANNED_NETWORK' in roicResults.roicAnalysis.components
              && roicResults.roicAnalysis.components['PLANNED_NETWORK']['network.premises']
              && roicResults.roicAnalysis.components['PLANNED_NETWORK']['network.premises'].values.length
              && currencyFormatter.format(
                (roicResults.priceModel.totalCost
                / roicResults.roicAnalysis.components['PLANNED_NETWORK']['network.premises'].values[0]) // no. of premises in year 0
                .toFixed(1)) + ' K'}</td>
            </tr>

            <tr>
              <td colSpan="2"><strong>Fiber Capex</strong></td>
            </tr>
            {roicResults.priceModel && roicResults.priceModel.fiberCosts.map((fiberCost, index) => {
              return (
                <tr key={index}>
                  <td className="indent-1 text-capitalize">
                    {FIBER_STRINGS[fiberCost.fiberType]} -&nbsp;
                    {`${CABLE_CONSTRUCTION_STRINGS[fiberCost.edgeFeatureType + '.' + fiberCost.edgeConstructionType]} `}
                    ({(fiberCost.lengthMeters * this.config.length.meters_to_length_units).toFixed(2)}&nbsp;
                    {this.config.length.length_units})
                  </td>
                  <td>{currencyFormatter.format((fiberCost.totalCost / 1000).toFixed(1)) + ' K'}</td>
                </tr>
              )}
            )}

            <tr>
              <td colSpan="2"><strong>Equipment Capex</strong></td>
            </tr>
            {roicResults.priceModel && roicResults.priceModel.equipmentCosts.map((equipmentCost, index) => {
              return (
                <tr key={index}>
                  <td className="indent-1 text-capitalize">
                    {networkEquipment.equipments[equipmentCost.nodeType] !== undefined
                      ? networkEquipment.equipments[equipmentCost.nodeType].label +
                        ' (X' + numberFormatter.format((equipmentCost.quantity).toFixed(0)) + ')'
                      : networkNodeTypesEntity[equipmentCost.nodeType] +
                        ' (X' + numberFormatter.format((equipmentCost.quantity).toFixed(0)) + ')'
                    }
                  </td>
                  <td>{currencyFormatter.format((equipmentCost.total / 1000).toFixed(1)) + ' K'}</td>
                </tr>
              )}
            )}

            {/* plannedNetworkDemand does not assigned or received from any where of the app,
            so condition is implemented to avoid error while rendering */}
            {this.props.plannedNetworkDemand !== undefined
              ? Object.entries(this.props.plannedNetworkDemand.locationDemand.entityDemands)
                .map(([key, value], index) => {
                  return (
                    <tr key={index}>
                      {key === 'small' || key === 'medium' || key === 'large' &&
                        <td className="indent-1 text-capitalize"> {key} Business </td>
                      }
                      {key === 'household' || key === 'celltower' &&
                        <td className="indent-1 text-capitalize"> {key} </td>
                      }
                      <td>{(value.rawCoverage).toFixed(0)}</td>
                    </tr>
                  )
                })
              : <tr />
            }
          </tbody>
        </table>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  enumStrings: state.roicReports.enumStrings,
  networkEquipment: state.mapLayers.networkEquipment,
  networkNodeTypesEntity: state.roicReports.networkNodeTypesEntity,
})

const RoicReportsSummaryComponent = connect(mapStateToProps, null)(RoicReportsSummary)
export default RoicReportsSummaryComponent
