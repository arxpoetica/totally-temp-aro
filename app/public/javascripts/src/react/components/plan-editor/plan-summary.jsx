import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import SummaryReports from '../sidebar/view/summary-reports.jsx'
import AroHttp from '../../common/aro-http'
import RoicReportsActions from '../sidebar/analysis/roic-reports/roic-reports-actions'

export const PlanSummary = (props) => {
  const summaryInstallationTypes = Object.freeze({
    INSTALLED: { id: 'INSTALLED', Label: 'Existing' },
    PLANNED: { id: 'PLANNED', Label: 'Planned' },
    Total: { id: 'Total', Label: 'Total' }
  })
  const summaryCategoryTypesObj = {
    Equipment: { summaryData: {}, totalSummary: {}, groupBy: 'networkNodeType', aggregateBy: 'count' },
    Fiber: { summaryData: {}, totalSummary: {}, groupBy: 'fiberType', aggregateBy: 'lengthMeters' },
    Coverage: { summaryData: {}, totalSummary: {}, groupBy: 'locationEntityType', aggregateBy: 'count' }
  }
  const intlNumberFormat = config.intl_number_format || 'en-US'
  const numberFormatter = new Intl.NumberFormat(intlNumberFormat)
  const metersToLength = config.length.meters_to_length_units

  const [state, setState] = useState({
    summaryCategoryTypes: summaryCategoryTypesObj,
    isKeyExpanded: {
      Equipment: false,
      Fiber: false,
      Coverage: false,
    },
    equipmentOrder: [],
    locTagCoverage: [],
    coverageOrder: [],
    isLocKeyExpanded: false,
  })

  const { summaryCategoryTypes, isKeyExpanded, equipmentOrder, coverageOrder, isLocKeyExpanded,
    locTagCoverage } = state

  const { selectedBoundaryType, currentTransaction, loadNetworkNodeTypesEntity, networkNodeTypesEntity,
    locationCategories, networkEquipment } = props

  useEffect(() => {
    // fetching equipment order from networkEquipment.json
    var equipmentOrderKey = summaryCategoryTypes['Equipment']['groupBy']
    const equipmentOrder = orderSummaryByCategory(networkEquipment.equipments, equipmentOrderKey)
    equipmentOrder.push('junction_splitter')

    // fetching location order from locationCategories.json
    var coverageOrderKey = 'plannerKey'
    const coverageOrder = orderSummaryByCategory(locationCategories.categories, coverageOrderKey)
    const isLocKeyExpanded = coverageOrder.reduce(function (result, item, index, array) {
      result[item] = false
      return result
    }, {})
    setState((state) => ({ ...state, equipmentOrder, coverageOrder, isLocKeyExpanded }))

    getPlanSummary()
    loadNetworkNodeTypesEntity()
  }, [])

  const orderSummaryByCategory = (obj, key) => {
    var categoryOrder = []

    // for (const [objKey, objValue] of Object.entries(obj)) {
    Object.keys(obj).forEach(objKey => {
      categoryOrder.push(obj[objKey][key])
    })

    return categoryOrder
  }

  const getPlanSummary = () => {
    let cachedRawSummary = null
    if (currentTransaction) {
      AroHttp.get(`/service/plan-library-feature-mods/76/equipment?userId=4`)
        .then((response) => {
          cachedRawSummary = {
            "priceModel": {
              "totalCost": 0,
              "equipmentCosts": [],
              "fiberCosts": []
            },
            "demandSummary": {
              "summaries": []
            },
            "networkStatistics": [],
            "equipmentSummary": [
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "location_connector",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "junction_splitter",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "bulk_distribution_terminal",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "fiber_distribution_hub",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "fiber_distribution_terminal",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "splice_point",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "subnet_node",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "junction_splitter",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "fiber_distribution_terminal",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "network_connector",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "network_anchor",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "multiple_dwelling_unit",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "loop_extender",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "central_office",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "network_connector",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "dslam",
                "modified": true,
                "equipmentCode": null,
                "count": 2
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "cell_5g",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "cell_5g",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "loop_extender",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "central_office",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "location_connector",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "fiber_distribution_hub",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "subnet_node",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "bulk_distribution_terminal",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "dslam",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "INSTALLED",
                "networkNodeType": "network_anchor",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "multiple_dwelling_unit",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              },
              {
                "deploymentType": "PLANNED",
                "networkNodeType": "splice_point",
                "modified": false,
                "equipmentCode": null,
                "count": 0
              }
            ],
            "fiberSummary": [],
            "equipmentCoverageSummary": [],
            "roicAnalysis": {
              "periods": 0,
              "components": {}
            }
          }
          formatSummary(cachedRawSummary)
        })
    }
  }

  const formatSummary = (planSummary) => {
    // Order Equipment Summary
    var OrderedEquipmentSummary = _.sortBy(planSummary.equipmentSummary, (obj) => _.indexOf(equipmentOrder, obj.networkNodeType))
    var equipmentSummary = OrderedEquipmentSummary

    var fiberSummary = planSummary.fiberSummary

    // Preprocessing Coverage Summary (rolling up tagSetCounts to count) and order
    var rawCoverageSummary = planSummary.equipmentCoverageSummary
    var orderedRawCoverageSummary = _.sortBy(rawCoverageSummary, (obj) => _.indexOf(coverageOrder, obj.locationEntityType))
    var processedCoverageSummary = processCoverageSummary(orderedRawCoverageSummary)

    let summaryCategoryTypes = summaryCategoryTypesObj

    summaryCategoryTypes['Equipment']['summaryData'] = transformSummary(equipmentSummary, summaryCategoryTypes['Equipment']['groupBy'], summaryCategoryTypes['Equipment']['aggregateBy'])
    summaryCategoryTypes['Fiber']['summaryData'] = transformSummary(fiberSummary, summaryCategoryTypes['Fiber']['groupBy'], summaryCategoryTypes['Fiber']['aggregateBy'])
    summaryCategoryTypes['Coverage']['summaryData'] = transformSummary(processedCoverageSummary, summaryCategoryTypes['Coverage']['groupBy'], summaryCategoryTypes['Coverage']['aggregateBy'])

    // Calculating Total Equipment Summary
    summaryCategoryTypes['Equipment']['totalSummary'] = calculateTotalByInstallationType(equipmentSummary, summaryCategoryTypes['Equipment']['aggregateBy'])
    // Calculating Total Fiber Summary
    summaryCategoryTypes['Fiber']['totalSummary'] = calculateTotalByInstallationType(fiberSummary, summaryCategoryTypes['Fiber']['aggregateBy'])
    // Calculating Total Coverage Summary
    summaryCategoryTypes['Coverage']['totalSummary'] = calculateTotalByInstallationType(processedCoverageSummary, summaryCategoryTypes['Coverage']['aggregateBy'])

    setState((state) => ({ ...state, summaryCategoryTypes }))
  }

  const calculateTotalByInstallationType = (equipmentSummary, aggregateBy) => {
    var totalEquipmentSummary = {}
    var existingEquip = equipmentSummary.filter(equipment => equipment.deploymentType === summaryInstallationTypes['INSTALLED'].id)
    var plannedEquip = equipmentSummary.filter(equipment => equipment.deploymentType === summaryInstallationTypes['PLANNED'].id)

    var existingEquipCountArray = existingEquip.map(exitingEqu => exitingEqu[aggregateBy])
    var plannedEquipCountArray = plannedEquip.map(plannedEqu => plannedEqu[aggregateBy])

    var existingEquipCount = existingEquipCountArray.length && existingEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    var plannedEquipCount = plannedEquipCountArray.length && plannedEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    var totalEuipCount = existingEquipCount + plannedEquipCount

    totalEquipmentSummary[summaryInstallationTypes['INSTALLED'].id] = [{ [aggregateBy]: existingEquipCount }]
    totalEquipmentSummary[summaryInstallationTypes['PLANNED'].id] = [{ [aggregateBy]: plannedEquipCount }]
    totalEquipmentSummary[summaryInstallationTypes['Total'].id] = [{ [aggregateBy]: totalEuipCount }]

    return totalEquipmentSummary
  }

  const transformSummary = (summary, groupByCategoryType, aggregateBy) => {
    var groupByNodeType = _.groupBy(summary, groupByCategoryType)
    var transformedSummary = {}

    Object.keys(groupByNodeType).forEach(nodeType => {
      transformedSummary[nodeType] = _.groupBy(groupByNodeType[nodeType], 'deploymentType')

      // Calculating total for planned and existing of a particular node type
      // transformedSummary[nodeType].Total = [{'count':_.reduce(_.map(groupByNodeType[nodeType],(obj) => 'lengthMeters' in obj ? obj.lengthMeters : obj.count), (memo, num) => memo + num, 0)}]
      transformedSummary[nodeType].Total = [{ [aggregateBy]: _.reduce(_.map(groupByNodeType[nodeType], (obj) => obj[aggregateBy]), (memo, num) => memo + num, 0) }]
    })

    return transformedSummary
  }

  const processCoverageSummary = (summary) => {
    var selectedBoundaryCoverageSummary = summary.filter(row => row.boundaryTypeId === selectedBoundaryType.id)
    selectedBoundaryCoverageSummary.forEach((row) => {
      // calculate count by aggregating 'count' in 'tagSetCounts' array of objects
      var tagSetCountsArray = row['tagSetCounts'].map(tagset => tagset['count'])
      row['count'] = tagSetCountsArray.length && tagSetCountsArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    })

    return selectedBoundaryCoverageSummary
  }

  const toggleIsKeyExpanded = (type) => {
    isKeyExpanded[type] = !isKeyExpanded[type]
    setState((state) => ({ ...state, isKeyExpanded }))
  }

  const togglelocationTagCoverage = (selectedCoverageLoc) => {
    isLocKeyExpanded[selectedCoverageLoc] = !isLocKeyExpanded[selectedCoverageLoc]
    // creating dummy install data
    // this.summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc]['INSTALLED'] = [{"deploymentType":"INSTALLED","nodeType":"dslam","locationEntityType":"small","boundaryTypeId":1,"tagSetCounts":[{"tagSet":[16],"count":1},{"tagSet":[13],"count":1}],"count":2}]

    var installedId = summaryInstallationTypes['INSTALLED'].id
    var plannedId = summaryInstallationTypes['PLANNED'].id
    var totalId = summaryInstallationTypes['Total'].id

    // get a location specific tagSetCounts per deploymentType
    var existing = summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId] &&
      summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId][0].tagSetCounts
    // differentiate tagSetCounts based on deploymentType which is used to display
    existing && existing.map(tag => tag.deploymentType = installedId)

    var planned = summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId] &&
      summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId][0].tagSetCounts
    planned && planned.map(tag => tag.deploymentType = plannedId)

    var tempTagSetCountsData = []
    existing && existing.map((arr) => tempTagSetCountsData.push(arr))
    planned && planned.map((arr) => tempTagSetCountsData.push(arr))

    var groupByTag = _.groupBy(tempTagSetCountsData, 'tagSet')

    var groupByTagDeploymentType = {}
    Object.keys(groupByTag).forEach((tag) => {
      groupByTagDeploymentType[tag] = _.groupBy(groupByTag[tag], 'deploymentType')
      groupByTagDeploymentType[tag][totalId] = [{ 'count': _.reduce(_.map(groupByTag[tag], (obj) => obj['count']), (memo, num) => memo + num, 0) }]
    })

    locTagCoverage[selectedCoverageLoc] = groupByTagDeploymentType
    setState((state) => ({ ...state, locTagCoverage, isLocKeyExpanded }))
  }

  return (
    <div>
      <table id="tblPlanSummary" className="table table-sm table-striped">
        <thead>
          <tr>
            <th></th>
            {
              Object.entries(summaryInstallationTypes).map(([installationType, info]) => (
                <td key={info.id}>{info.Label}</td>
              ))
            }
          </tr>
        </thead>
        {/* Display plan summary */}
        {
          Object.entries(summaryCategoryTypes).map(([categoryType, categoryinfo]) => {
            return (
              categoryType !== 'Coverage'
              ? (
                <tbody>
                  {/* Display total summary of a category */}
                  <tr>
                    <th id="pointer" onClick={() => toggleIsKeyExpanded(categoryType)}>
                      {
                        !isKeyExpanded[categoryType]
                          ? <i className="far fa-plus-square ei-foldout-icon" />
                          : <i className="far fa-minus-square ei-foldout-icon" />
                      }                      
                      { categoryType }
                    </th>

                    {/* Display installation types */}
                    {
                      categoryinfo['aggregateBy'] === 'count' &&
                      (
                        Object.entries(summaryInstallationTypes).map(([installationType, info]) => (
                          <th>
                            { 
                              Object.keys(categoryinfo['totalSummary']).length &&
                              categoryinfo['totalSummary'][installationType][0][categoryinfo['aggregateBy']]
                            }
                          </th>
                        ))
                      )
                    }
                    {/* Display with two decimal points */}
                    {
                      categoryinfo['aggregateBy'] !== 'count' &&
                      (
                        Object.entries(summaryInstallationTypes).map(([installationType, info]) => (
                          <th>
                            { 
                              Object.keys(categoryinfo['totalSummary']).length &&
                              numberFormatter.format((categoryinfo['totalSummary'][installationType][0][categoryinfo['aggregateBy']] * metersToLength).toFixed(1))
                            }
                          </th>
                        ))
                      )
                    }
                  </tr>
                  {
                    isKeyExpanded[categoryType] && categoryType === 'Coverage' &&
                    <tr>
                      <td colSpan="4" className="indent-1">
                        { selectedBoundaryType.description }
                      </td>
                    </tr>
                  }

                  {/* Display each element summary in category */}
                  {
                    isKeyExpanded[categoryType] &&
                    (
                      Object.entries(categoryinfo['summaryData']).map(([name, installationType]) => (
                        <tr>
                          {/* For category type 'Equipment' display nicer names */}
                          {
                            categoryType === 'Equipment'
                            ? <td className="indent-1">{ networkNodeTypesEntity && networkNodeTypesEntity[name] }</td>
                            : <td className="indent-1 text-capitalize">{ name }</td>
                          }
                          {/* Display installation types */}
                          {
                            categoryinfo['aggregateBy'] !== 'count'
                            ? (
                                Object.entries(summaryInstallationTypes).map(([type, info]) => (
                                  <td>
                                    {
                                      Object.keys(categoryinfo['totalSummary']).length &&
                                      installationType[type][0][categoryinfo['aggregateBy']] || 0
                                    }
                                  </td>
                                ))
                              )
                            : (
                                Object.entries(summaryInstallationTypes).map(([type, info]) => (
                                  <td>
                                    {
                                      Object.keys(categoryinfo['totalSummary']).length &&
                                      numberFormatter.format((categoryinfo['totalSummary'][type][0][categoryinfo['aggregateBy']] || 0 * metersToLength).toFixed(1))
                                    }
                                  </td>
                                ))
                              )
                          }
                        </tr>
                      ))
                    )
                  }
                </tbody>
              )
            : (
                // Display Coverage summary
                <tbody>
                  {/* coverage total summary */}
                  <tr>
                    <th id="pointer" onClick={() => toggleIsKeyExpanded('Coverage')}>
                      {
                        !isKeyExpanded['Coverage']
                          ? <i className="far fa-plus-square ei-foldout-icon" />
                          : <i className="far fa-minus-square ei-foldout-icon" />
                      }                      
                      Coverage
                    </th>
                    {
                      Object.keys(summaryCategoryTypes['Coverage']['totalSummary']).length &&
                      (
                        <>
                          <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['INSTALLED'].id][0].count }</td>
                          <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['PLANNED'].id][0].count }</td>
                          <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['Total'].id][0].count }</td>
                        </>
                      )
                    }
                  </tr>
                  {
                    isKeyExpanded['Coverage'] &&
                    <tr>
                      <td colSpan="4" className="indent-1">
                        { selectedBoundaryType.description }
                      </td>
                    </tr>
                  }
                </tbody>  
              )
            )
          })
        }
        {
          isKeyExpanded['Coverage'] &&
          (
            Object.entries(summaryCategoryTypes['Coverage']['summaryData']).map(([locationEntityType, coverageinfo]) => (
              <tbody>
                <tr>
                  <td id="pointer" onClick={() => togglelocationTagCoverage(locationEntityType)}>
                    {
                      !isLocKeyExpanded[locationEntityType]
                        ? <i className="far fa-plus-square ei-foldout-icon" />
                        : <i className="far fa-minus-square ei-foldout-icon" />
                    }                      
                    { locationEntityType }
                  </td>
                  <td>{ coverageinfo[summaryInstallationTypes['INSTALLED'].id][0].count || 0 }</td>
                  <td>{ coverageinfo[summaryInstallationTypes['PLANNED'].id][0].count || 0 }</td>
                  <td>{ coverageinfo[summaryInstallationTypes['Total'].id][0].count || 0 }</td>
                </tr>
                {
                  isLocKeyExpanded[locationEntityType] &&
                  (
                    Object.entries(locTagCoverage[locationEntityType]).map(([tag, taginfo]) => (
                      <tr>
                        <td class="indent-2"> { layerTagTodescription[tag] }</td>
                        <td>{ taginfo[summaryInstallationTypes['INSTALLED'].id][0].count || 0 }</td>
                        <td>{ taginfo[summaryInstallationTypes['PLANNED'].id][0].count || 0 }</td>
                        <td>{ taginfo[summaryInstallationTypes['Total'].id][0].count || 0 }</td>
                      </tr>
                    ))
                  )
                }
              </tbody>
            ))
          )
        }
      </table>

      {/* Show buttons for downloading plan summary reports */}
      <SummaryReports />

      {/* Add a div that will overlay all the controls above. The div will be visible when the controls need to be disabled. */}
      {/* { currentTransaction && <div className="disable-sibling-controls" /> } */}
    </div>
  )
}

const mapStateToProps = (state) => ({
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
  currentTransaction: state.planEditor.transaction || 10,
  networkEquipment: state.toolbar.appConfiguration.networkEquipment,
  locationCategories: state.toolbar.appConfiguration.locationCategories,
  networkNodeTypesEntity: state.roicReports.networkNodeTypesEntity,
})

const mapDispatchToProps = (dispatch) => ({
  loadNetworkNodeTypesEntity: () => dispatch(RoicReportsActions.loadNetworkNodeTypesEntity()),
})

export default wrapComponentWithProvider(reduxStore, PlanSummary, mapStateToProps, mapDispatchToProps)
