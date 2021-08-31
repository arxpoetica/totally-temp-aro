import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import SummaryReports from '../sidebar/view/summary-reports.jsx'
import AroHttp from '../../common/aro-http'
import RoicReportsActions from '../sidebar/analysis/roic-reports/roic-reports-actions'
import { usePrevious, groupBy } from '../../common/view-utils.js'

export const PlanSummary = (props) => {
  const summaryInstallationTypes = Object.freeze({
    INSTALLED: { id: 'INSTALLED', Label: 'Existing' },
    PLANNED: { id: 'PLANNED', Label: 'Planned' },
    Total: { id: 'Total', Label: 'Total' },
  })
  const summaryCategoryTypesObj = {
    Equipment: { summaryData: {}, totalSummary: {}, groupBy: 'networkNodeType', aggregateBy: 'count' },
    Fiber: { summaryData: {}, totalSummary: {}, groupBy: 'fiberType', aggregateBy: 'lengthMeters' },
    Coverage: { summaryData: {}, totalSummary: {}, groupBy: 'locationEntityType', aggregateBy: 'count' },
  }
  const metersToLength = config.length.meters_to_length_units

  const [state, setState] = useState({
    summaryCategoryTypes: summaryCategoryTypesObj,
    cachedRawSummary: null,
    isKeyExpanded: {
      Equipment: false,
      Fiber: false,
      Coverage: false,
    },
    equipmentOrder: [],
    locTagCoverage: [],
    coverageOrder: [],
    isLocKeyExpanded: false,
    layerTagTodescription: {},
  })

  const { summaryCategoryTypes, isKeyExpanded, equipmentOrder, coverageOrder, isLocKeyExpanded,
    locTagCoverage, cachedRawSummary } = state

  const { selectedBoundaryType, currentTransaction, loadNetworkNodeTypesEntity, networkNodeTypesEntity,
    locationCategories, networkEquipment, layerCategories, isPlanEditorChanged, layerTagTodescription } = props

  useEffect(() => {
    // fetching equipment order from networkEquipment.json
    const equipmentOrderKey = summaryCategoryTypes['Equipment']['groupBy']
    const equipmentOrder = orderSummaryByCategory(networkEquipment.equipments, equipmentOrderKey)
    equipmentOrder.push('junction_splitter')

    // fetching location order from locationCategories.json
    const coverageOrderKey = 'plannerKey'
    const coverageOrder = orderSummaryByCategory(locationCategories.categories, coverageOrderKey)
    const isLocKeyExpanded = coverageOrder.reduce(function (result, item) {
      result[item] = false
      return result
    }, {})

    setState((state) => ({ ...state, equipmentOrder, coverageOrder, isLocKeyExpanded }))
    loadNetworkNodeTypesEntity()
  }, [])

  const oldTransaction = usePrevious(currentTransaction)
  useEffect(() => {
    if (oldTransaction && oldTransaction !== currentTransaction) {
      // Current transaction has changed. Recalculate plan summary.
      getPlanSummary()
    }
  }, [currentTransaction])

  const orderSummaryByCategory = (obj, key) => {
    return Object.keys(obj).map(objKey => obj[objKey][key])
  }

  const getPlanSummary = () => {
    setState((state) => ({ ...state, cachedRawSummary: null }))
    if (currentTransaction) {
      AroHttp.get(`/service/plan-transaction/${currentTransaction.id}/plan_summary/`)
        .then((response) => {
          const cachedRawSummary = response.data
          formatSummary(cachedRawSummary)
          setState((state) => ({ ...state, cachedRawSummary }))
        })
    }
  }

  const prevSelectedBoundaryType = usePrevious(selectedBoundaryType)
  useEffect(() => {
    if (prevSelectedBoundaryType && prevSelectedBoundaryType.id !== selectedBoundaryType.id) {
      // Selected boundary type has changed
      cachedRawSummary && formatSummary(cachedRawSummary)
    }
  }, [selectedBoundaryType])

  useEffect(() => {
    getPlanSummary()
  }, [equipmentOrder])

  useEffect(() => {
    const layerTagCategories = {}
    Object.keys(layerCategories).forEach((categoryId) => {
      Object.keys(layerCategories[categoryId].tags).forEach((tagId) => {
        const tag = layerCategories[categoryId].tags[tagId]
        layerTagCategories[tag.id] = tag.description
      })
    })
    setState((state) => ({ ...state, layerTagTodescription: layerTagCategories }))
  }, [layerCategories])

  useEffect(() => {
    isPlanEditorChanged && getPlanSummary()
  }, [isPlanEditorChanged])

  const formatSummary = (planSummary) => {
    // Order Equipment Summary
    const OrderedEquipmentSummary = planSummary.equipmentSummary.sort((a, b) => {
      return equipmentOrder.indexOf(a.networkNodeType) - equipmentOrder.indexOf(b.networkNodeType)
    })
    const equipmentSummary = OrderedEquipmentSummary

    const { fiberSummary } = planSummary

    // Preprocessing Coverage Summary (rolling up tagSetCounts to count) and order
    const rawCoverageSummary = planSummary.equipmentCoverageSummary
    const orderedRawCoverageSummary = rawCoverageSummary.sort((a, b) => {
      return coverageOrder.indexOf(a.locationEntityType) - coverageOrder.indexOf(b.locationEntityType)
    })
    const processedCoverageSummary = processCoverageSummary(orderedRawCoverageSummary)

    const summaryCategoryTypes = summaryCategoryTypesObj

    summaryCategoryTypes['Equipment']['summaryData'] = transformSummary(
      equipmentSummary, summaryCategoryTypes['Equipment']['groupBy'], summaryCategoryTypes['Equipment']['aggregateBy']
    )
    summaryCategoryTypes['Fiber']['summaryData'] = transformSummary(
      fiberSummary, summaryCategoryTypes['Fiber']['groupBy'], summaryCategoryTypes['Fiber']['aggregateBy']
    )
    summaryCategoryTypes['Coverage']['summaryData'] = transformSummary(
      processedCoverageSummary, summaryCategoryTypes['Coverage']['groupBy'],
      summaryCategoryTypes['Coverage']['aggregateBy']
    )

    // Calculating Total Equipment Summary
    summaryCategoryTypes['Equipment']['totalSummary'] = calculateTotalByInstallationType(
      equipmentSummary, summaryCategoryTypes['Equipment']['aggregateBy']
    )
    // Calculating Total Fiber Summary
    summaryCategoryTypes['Fiber']['totalSummary'] = calculateTotalByInstallationType(
      fiberSummary, summaryCategoryTypes['Fiber']['aggregateBy']
    )
    // Calculating Total Coverage Summary
    summaryCategoryTypes['Coverage']['totalSummary'] = calculateTotalByInstallationType(
      processedCoverageSummary, summaryCategoryTypes['Coverage']['aggregateBy']
    )

    setState((state) => ({ ...state, summaryCategoryTypes }))
  }

  const calculateTotalByInstallationType = (equipmentSummary, aggregateBy) => {
    const totalEquipmentSummary = {}
    const existingEquip = equipmentSummary.filter(
      equipment => equipment.deploymentType === summaryInstallationTypes['INSTALLED'].id
    )
    const plannedEquip = equipmentSummary.filter(
      equipment => equipment.deploymentType === summaryInstallationTypes['PLANNED'].id
    )

    const existingEquipCountArray = existingEquip.map(exitingEqu => exitingEqu[aggregateBy])
    const plannedEquipCountArray = plannedEquip.map(plannedEqu => plannedEqu[aggregateBy])

    const existingEquipCount = existingEquipCountArray.length
      && existingEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    const plannedEquipCount = plannedEquipCountArray.length
      && plannedEquipCountArray.reduce((accumulator, currentValue) => accumulator + currentValue)
    const totalEuipCount = existingEquipCount + plannedEquipCount

    totalEquipmentSummary[summaryInstallationTypes['INSTALLED'].id] = [{ [aggregateBy]: existingEquipCount }]
    totalEquipmentSummary[summaryInstallationTypes['PLANNED'].id] = [{ [aggregateBy]: plannedEquipCount }]
    totalEquipmentSummary[summaryInstallationTypes['Total'].id] = [{ [aggregateBy]: totalEuipCount }]

    return totalEquipmentSummary
  }

  const transformSummary = (summary, groupByCategoryType, aggregateBy) => {
    const groupByNodeType = groupBy(summary, groupByCategoryType)

    const transformedSummary = {}

    Object.keys(groupByNodeType).forEach(nodeType => {
      transformedSummary[nodeType] = groupBy(groupByNodeType[nodeType], 'deploymentType')

      // Calculating total for planned and existing of a particular node type
      transformedSummary[nodeType].Total = [{
        [aggregateBy]: groupByNodeType[nodeType].map((obj) => obj[aggregateBy]).reduce((memo, num) => memo + num, 0)
      }]
    })

    return transformedSummary
  }

  const processCoverageSummary = (summary) => {
    const selectedBoundaryCoverageSummary = summary.filter(row => row.boundaryTypeId === selectedBoundaryType.id)
    selectedBoundaryCoverageSummary.forEach((row) => {
      // calculate count by aggregating 'count' in 'tagSetCounts' array of objects
      const tagSetCountsArray = row['tagSetCounts'].map(tagset => tagset['count'])
      row['count'] = tagSetCountsArray.length
        && tagSetCountsArray.reduce((accumulator, currentValue) => accumulator + currentValue)
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

    const installedId = summaryInstallationTypes['INSTALLED'].id
    const plannedId = summaryInstallationTypes['PLANNED'].id
    const totalId = summaryInstallationTypes['Total'].id

    // get a location specific tagSetCounts per deploymentType
    const existing = summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId] &&
      summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][installedId][0].tagSetCounts
    // differentiate tagSetCounts based on deploymentType which is used to display
    existing && existing.map(tag => tag.deploymentType = installedId)

    const planned = summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId] &&
      summaryCategoryTypes['Coverage']['summaryData'][selectedCoverageLoc][plannedId][0].tagSetCounts
    planned && planned.map(tag => tag.deploymentType = plannedId)

    const tempTagSetCountsData = []
    existing && existing.map((arr) => tempTagSetCountsData.push(arr))
    planned && planned.map((arr) => tempTagSetCountsData.push(arr))

    const groupByTag = groupBy(tempTagSetCountsData, 'tagSet')

    const groupByTagDeploymentType = {}
    Object.keys(groupByTag).forEach((tag) => {
      groupByTagDeploymentType[tag] = groupBy(groupByTag[tag], 'deploymentType')
      groupByTagDeploymentType[tag][totalId] = [{
        count: groupByTag[tag].map((obj) => obj['count']).reduce((memo, num) => memo + num, 0)
      }]
    })

    locTagCoverage[selectedCoverageLoc] = groupByTagDeploymentType
    setState((state) => ({ ...state, locTagCoverage, isLocKeyExpanded }))
  }

  return (
    <>
      <table id="tblPlanSummary" className="table table-sm table-striped">
        <thead>
          <tr>
            <th></th>
            {
              Object.entries(summaryInstallationTypes).map(([installationType, info], index) => (
                <td key={index}>{info.Label}</td>
              ))
            }
          </tr>
        </thead>
        {/* Display plan summary */}
        {
          Object.entries(summaryCategoryTypes).map(([categoryType, categoryinfo], summaryIndex) => {
            return (
              categoryType !== 'Coverage'
              ? (
                <tbody key={summaryIndex}>
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
                      categoryinfo['aggregateBy'] === 'count'
                      ? (
                          Object.entries(summaryInstallationTypes).map(([installationType], index) => (
                            <th key={index}>
                              {
                                Object.keys(categoryinfo['totalSummary']).length &&
                                categoryinfo['totalSummary'][installationType][0][categoryinfo['aggregateBy']]
                              }
                            </th>
                          ))
                        )
                      : (
                          Object.entries(summaryInstallationTypes).map(([installationType], index) => (
                            // Display with two decimal points
                            <th key={index}>
                              {
                                Object.keys(categoryinfo['totalSummary']).length &&
                                (categoryinfo['totalSummary'][installationType][0][categoryinfo['aggregateBy']]
                                  || 0 * metersToLength).toFixed(1)
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
                      Object.entries(categoryinfo['summaryData']).map(([name, installationType], categoryIndex) => (
                        <tr key={categoryIndex}>
                          {/* For category type 'Equipment' display nicer names */}
                          {
                            categoryType === 'Equipment'
                              ? <td className="indent-1">{ networkNodeTypesEntity && networkNodeTypesEntity[name] }</td>
                              : <td className="indent-1 text-capitalize">{ name }</td>
                          }
                          {/* Display installation types */}
                          {
                            categoryinfo['aggregateBy'] === 'count'
                            ? (
                                Object.entries(summaryInstallationTypes).map(([type], index) => (
                                  <td key={index}>
                                    {
                                      Object.keys(categoryinfo['totalSummary']).length &&
                                      installationType[type][0][categoryinfo['aggregateBy']] || 0
                                    }
                                  </td>
                                ))
                              )
                            : (
                                Object.entries(summaryInstallationTypes).map(([type], index) => (
                                  // converting to client specific units
                                  <td key={index}>
                                    {
                                      Object.keys(categoryinfo['totalSummary']).length &&
                                      (installationType[type][0][categoryinfo['aggregateBy']]
                                        || 0 * metersToLength).toFixed(1)
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
                <tbody key={summaryIndex}>
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
                      Object.keys(summaryCategoryTypes['Coverage']['totalSummary']).length
                      ? (
                          <>
                            <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['INSTALLED'].id][0].count }</td>
                            <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['PLANNED'].id][0].count }</td>
                            <td>{ summaryCategoryTypes['Coverage']['totalSummary'][summaryInstallationTypes['Total'].id][0].count }</td>
                          </>
                        )
                      : <td colSpan="3"></td>
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
            Object.entries(summaryCategoryTypes['Coverage']['summaryData']).map(
              ([locationEntityType, coverageinfo], categoryIndex) => (
              <tbody key={categoryIndex}>
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
                    Object.entries(locTagCoverage[locationEntityType]).map(([tag, taginfo], index) => (
                      <tr key={index}>
                        <td className="indent-2">{ layerTagTodescription[tag] }</td>
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

      {/* Add a div that will overlay all the controls above.
        The div will be visible when the controls need to be disabled. */}
      { currentTransaction && <div className="disable-sibling-controls" /> }
    </>
  )
}

const mapStateToProps = (state) => ({
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
  currentTransaction: state.planEditor.transaction,
  networkEquipment: state.toolbar.appConfiguration.networkEquipment,
  locationCategories: state.toolbar.appConfiguration.locationCategories,
  networkNodeTypesEntity: state.roicReports.networkNodeTypesEntity,
  layerCategories: state.stateViewMode.layerCategories,
  isPlanEditorChanged: state.planEditor.isPlanEditorChanged,
})

const mapDispatchToProps = (dispatch) => ({
  loadNetworkNodeTypesEntity: () => dispatch(RoicReportsActions.loadNetworkNodeTypesEntity()),
})

export default wrapComponentWithProvider(reduxStore, PlanSummary, mapStateToProps, mapDispatchToProps)
