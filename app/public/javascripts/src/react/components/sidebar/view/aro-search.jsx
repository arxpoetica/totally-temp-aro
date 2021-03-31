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

  handleOptionsList(entityType) {
    const { configuration } = this.props
    return entityType.map((type) => {
      return { id: type.id, value: type[configuration], label: type[configuration], name: type.name }
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
    entityType === 'LocationObjectEntity'
      ? this.onSearchResult(entityTypeList[entityType][0])
      : this.props.onSelectedBoundary(entityTypeList[entityType][0])
  }

  handleInputChange(searchText, { action }) {
    switch (action) {
      case 'input-change':
        this.setState({ searchText })
        const { entityType, searchColumn, configuration } = this.props
        if (entityType) {
          this.props.loadEntityList(entityType, searchText, searchColumn, configuration)
          setTimeout(function() {
            if (JSON.parse(JSON.stringify(this.props.entityTypeList[entityType].length))) {
              this.setState({ isDropDownEnable: true })
            }
          }.bind(this), 1000)
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
        blurInputOnSelect
        onFocus={() => this.onFocus()}
        options={
          entityTypeList[entityType] && entityTypeList[entityType].length
            ? this.handleOptionsList(entityTypeList[entityType])
            : []
        }
        components={{ Option, DropdownIndicator: null }}
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
