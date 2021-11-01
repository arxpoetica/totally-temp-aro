import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Select, { components } from 'react-select'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import SelectionActions from '../../selection/selection-actions'
import AroHttp from '../../../common/aro-http'
import createClass from 'create-react-class'
import RxState from '../../../common/rxState'
import { dequal } from 'dequal'
import { entityTypeCons } from '../constants'
import './road-segment-detail.css'

export class AroSearch extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isDropDownEnable: false,
      searchText: null,
    }

    this.rxState = new RxState()
  }

  componentDidUpdate(prevProps) {
    const { entityType: oldEntityType, selectedMapFeatures: oldSelectedMapFeatures } = prevProps
    const { entityType: newEntityType, selectedMapFeatures: newSelectedMapFeatures } = this.props

    if (oldEntityType !== newEntityType || !dequal(oldSelectedMapFeatures, newSelectedMapFeatures)) {
      this.setState({ searchText: null })
    }
  }

  handleOptionsList(entityTypeArg) {
    const { entityType, searchColumn } = this.props
    const configurationKey = entityType === entityTypeCons.SERVICE_AREA_VIEW ? 'code' : searchColumn
    return entityTypeArg.map((type) => {
      return { id: type.id, value: type[configurationKey], label: type[configurationKey], name: type.name }
    })
  }

  onKeyDown(event) {
    if (event.keyCode === 13) {
      this.setState({ isDropDownEnable: true })
    }
  }

  onBlur() {
    this.setState({ isDropDownEnable: false })
  }

  onFocus() {
    const { entityType, entityTypeList } = this.props
    if (entityType) {
      if (entityTypeList[entityType].length) {
        this.setState({ isDropDownEnable: true, searchText: null })
      }
    }
  }

  handleChange(searchText) {
    this.setState({ searchText })
    const { entityType, entityTypeList } = this.props
    const searchObj = entityTypeList[entityType].find(boundary => {
      return (
        boundary.objectId
        || boundary.code
        || boundary.tabblockId
        || boundary.clli
      ) === searchText.label
    })
    if (entityType === entityTypeCons.LOCATION_OBJECT_ENTITY) {
      this.onSearchResult(searchObj)
    } else if (entityType === entityTypeCons.CENSUS_BLOCKS_ENTITY
        || entityType === entityTypeCons.SERVICE_AREA_VIEW 
        || entityType === entityTypeCons.ANALYSIS_AREA
    ) {
      this.props.onSelectedBoundary(searchObj)
    } else if (entityType === entityTypeCons.NETWORK_EQUIPMENT_ENTITY) {
      this.props.onSelectionChanged(searchObj, true)
    }
  }

  handleInputChange(searchText, { action }) {
    switch (action) {
      case 'input-change':
        this.setState({ searchText })
        const { entityType, select, searchColumn, configuration } = this.props
        if (entityType) {
          this.props.loadEntityList(entityType, searchText, select, searchColumn, configuration)
            .then(result => {
              if (JSON.parse(JSON.stringify(this.props.entityTypeList[entityType].length))) {
                this.setState({ isDropDownEnable: true })
              }
            })
        }
        return
      default:
        return
    }
  }

  onSearchResult(selectedLocation) {
    this.props.setSelectedLocations([selectedLocation.id])
    AroHttp.get(`/service/odata/LocationObjectEntity?$select=id,geom&$filter=id eq ${selectedLocation.id}&$top=1`)
      .then(result => {
        const location = result.data[0]
        const ZOOM_FOR_LOCATION_SEARCH = 17
        const mapObject = {
          latitude: location.geom.coordinates[1],
          longitude: location.geom.coordinates[0],
        }
        this.rxState.requestSetMapCenter.sendMessage(mapObject)
        this.rxState.requestSetMapZoom.sendMessage(ZOOM_FOR_LOCATION_SEARCH)
      })
      .catch(err => console.error(err))
  }

  render() {
    const { objectName, entityTypeList, entityType } = this.props
    const { isDropDownEnable, searchText } = this.state

    return (
      <Select
        value={searchText}
        closeMenuOnSelect={true}
        isSearchable={true}
        menuIsOpen={isDropDownEnable}
        placeholder={`Select or search a ${objectName} in the list...`}
        onChange={(event, action) => this.handleChange(event, action)}
        onInputChange={(event, action) => this.handleInputChange(event, action)}
        onKeyDown={(event) => this.onKeyDown(event)}
        onBlur={(event) => this.onBlur(event)}
        styles={{
          placeholder: (style) => ({ ...style, pointerEvents: "none" }),
          input: (style) => ({ ...style, width: "100%" }),
        }}
        blurInputOnSelect
        onFocus={() => this.onFocus()}
        options={
          entityTypeList[entityType] && entityTypeList[entityType].length
            ? this.handleOptionsList(entityTypeList[entityType])
            : []
        }
        components={{ Option, DropdownIndicator: null }}
        classNamePrefix="search-bar"
      />
    )
  }
}

const Option = createClass({
  render() {
    return (
      <>
        <components.Option {...this.props}>
          <label>
            {this.props.value}
            &nbsp;
            {
              this.props.value && this.props.data.name !== null
                ? this.props.data.name
                : ''
            }
          </label>
        </components.Option>
      </>
    )
  }
})

const mapStateToProps = (state) => ({
  entityTypeList: state.stateViewMode.entityTypeList,
  selectedMapFeatures: state.selection.mapFeatures,
})

const mapDispatchToProps = (dispatch) => ({
  loadEntityList: (entityType, filterObj, select, searchColumn, configuration) => dispatch(
    StateViewModeActions.loadEntityList(entityType, filterObj, select, searchColumn, configuration)
  ),
  setSelectedLocations: locationIds => dispatch(SelectionActions.setLocations(locationIds)),
})

const AroSearchComponent = wrapComponentWithProvider(
  reduxStore, AroSearch, mapStateToProps, mapDispatchToProps
)
export default AroSearchComponent
