import React, { Component } from 'react'
import { connect } from 'react-redux'
import TileDataService from '../../../../components/tiles/tile-data-service'
import ToolBarActions from '../../header/tool-bar-actions'
import RxState from '../../../common/rxState'
import '../sidebar.css'

export class ViewSettings extends Component {
  constructor (props) {
    super(props)

    this.tileDataService = new TileDataService();
    this.rxState = new RxState(); // For RxJs implementation in react-js

    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption = this.props.viewFiberOptions[0];
    this.props.setViewSetting(newViewSetting)

    // Map tile settings used for debugging
    this.rxState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.mapTileOptions = JSON.parse(JSON.stringify(mapTileOptions))
    })

    this.state = {
      mapTileOptions: this.mapTileOptions,
      tileDataService: this.tileDataService,
      equipmentPropertiesToRender: JSON.stringify(this.props.configuration.networkEquipment.labelDrawingOptions.properties)
    }
  }

  componentDidMount () {
    // Need to subscribe for setState the mapTileOptions
    this.rxState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.setState({ mapTileOptions: JSON.parse(JSON.stringify(mapTileOptions)) })
    })
  }

  render () {

    const { viewSetting, viewFiberOptions } = this.props
    const { mapTileOptions, tileDataService, equipmentPropertiesToRender } = this.state

    return (
      <table className="table table-sm table-striped view-settings">
        <tbody>
          <tr>
            <td>Fiber Width</td>
            <td>
              <select className="form-control" onChange={(e) => this.fiberOptionDropDownChanged(e)} value={viewSetting.selectedFiberOption.name}>
                {viewFiberOptions.map((item, index) =>
                  <option key={index} value={item.name} label={item.name}></option>
                )}
              </select>
            </td>
          </tr>

          {viewSetting.selectedFiberOption.pixelWidth &&
            <tr>
              <td>Max Pixel Width</td>
              <td>
                <input className="form-control" name="pixelWidth" type="text" value={viewSetting.selectedFiberOption.pixelWidth.max}
                  onChange={(e) => this.fiberOptionInputMaxChanged(e)} placeholder="Max Pixel Width"/>
              </td>
            </tr>
          }

          {viewSetting.selectedFiberOption.pixelWidth &&
            <tr>
              <td>Min Pixel Width</td>
              <td>
                <input className="form-control" name="pixelWidth" type="text" value={viewSetting.selectedFiberOption.pixelWidth.min}
                  onChange={(e) => this.fiberOptionInputMinChanged(e)} placeholder="Min Pixel Width"/>
              </td>
            </tr>
          }

          {viewSetting.selectedFiberOption.opacity &&
            <tr>
              <td>Max Opacity</td>
              <td>
                <input className="form-control" name="opacity" type="text" value={viewSetting.selectedFiberOption.opacity.max}
                  onChange={(e) => this.fiberOptionInputMaxChanged(e)} placeholder="Max Opacity"/>
              </td>
            </tr>
          }

          {viewSetting.selectedFiberOption.opacity &&
            <tr>
              <td>Min Opacity</td>
              <td>
                <input className="form-control" name="opacity" type="text" value={viewSetting.selectedFiberOption.opacity.min}
                  onChange={(e) => this.fiberOptionInputMinChanged(e)} placeholder="Min Opacity"/>
              </td>
            </tr>
          }

          {viewSetting.selectedFiberOption.pixelWidth &&
            <tr>
              <td>Exponent</td>
              <td>
                <input className="form-control" name="divisor" type="text" value={viewSetting.selectedFiberOption.pixelWidth.divisor}
                  onChange={(e) => this.fiberOptionInputDivisorChanged(e)} placeholder="Exponent"/>
              </td>
            </tr>
          }

          {viewSetting.selectedFiberOption.pixelWidth && viewSetting.selectedFiberOption.pixelWidth.atomicDivisor &&
            <tr>
              <td>Atomic Divisor</td>
              <td>
                <input className="form-control" name="atomicDivisor" type="text" value={viewSetting.selectedFiberOption.pixelWidth.atomicDivisor}
                  onChange={(e) => this.fiberOptionInputDivisorChanged(e)} placeholder="Atomic Divisor"/>
              </td>
            </tr>
          }

          <tr>
            <td>Show tile information on map</td>
            <td>
              <input type="checkbox" className="checkboxfill" checked={mapTileOptions.showTileExtents} onChange={(e) => this.updateState(e)}/>
            </td>
          </tr>

          <tr>
            <td>Tile Fetcher</td>
            <td>
              <select className="form-control" onChange={(e) => this.onActiveTileFetcherChanged(e)} value={tileDataService.activeTileFetcher.description}>
                {tileDataService.tileFetchers.map((item, index) =>
                  <option key={index} value={item.description} label={item.description}></option>
                )}
              </select>
            </td>
          </tr>

          <tr>
            <td>Show equipment properties (csv)</td>
            <td>
              <div className="input-group">
                <input className="form-control" type="text" value={equipmentPropertiesToRender} onChange={(e) => this.equipmentPropertiesToRender(e)}/>
                <span className="input-group-btn">
                  <button className="btn btn-light" onClick={(e) => this.saveEquipmentPropertiesToRender(e)}>Save</button>
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <th colSpan="2">Heatmap settings</th>
          </tr>

          <tr>
            <td>Power</td>
            <td>
              <input className="form-control" type="text" value={mapTileOptions.heatMap.powerExponent} onChange={(e) => this.updatePower(e)}/>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  fiberOptionDropDownChanged (e) {
    // To set selectedFiberOptionin in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption = this.props.viewFiberOptions.filter(selectedFiberOption => selectedFiberOption.name === e.target.value)[0]
    this.props.setViewSetting(newViewSetting)

    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  fiberOptionInputMaxChanged (e) {
    // To set InputMax in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption[e.target.name].max = e.target.value
    this.props.setViewSetting(newViewSetting)

    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  fiberOptionInputMinChanged (e) {
    // To set InputMin in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption[e.target.name].min = e.target.value
    this.props.setViewSetting(newViewSetting)

    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  fiberOptionInputDivisorChanged (e) {
    // To set InputDivisor in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption.pixelWidth[[e.target.name]] = e.target.value
    this.props.setViewSetting(newViewSetting)

    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  updateState(){
    const mapTileOptions = this.state.mapTileOptions
    mapTileOptions.showTileExtents = !this.state.mapTileOptions.showTileExtents
    this.setState({ mapTileOptions });

    const newMapTileOptions = JSON.parse(JSON.stringify(this.state.mapTileOptions))
    this.rxState.mapTileOptions.sendMessage(newMapTileOptions)
  }


  onActiveTileFetcherChanged(e) {
    const tileDataService = this.state.tileDataService
    tileDataService.tileFetchers.filter((item) => {
      if (e.target.value === item.description){
        return (
          tileDataService.activeTileFetcher = item
        )
      }
    })

    this.setState({ tileDataService });
    // If the tile fetcher changes, delete the tile cache and re-render everything
    this.tileDataService.clearDataCache()
    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  equipmentPropertiesToRender (e) {
    this.setState({ equipmentPropertiesToRender: e.target.value })

    const newMapTileOptions = JSON.parse(JSON.stringify(this.state.mapTileOptions))
    this.rxState.mapTileOptions.sendMessage(newMapTileOptions)
  }

  updatePower (e) {
    const mapTileOptions = this.state.mapTileOptions
    mapTileOptions.heatMap.powerExponent = e.target.value
    this.setState({ mapTileOptions })

    const newMapTileOptions = JSON.parse(JSON.stringify(this.state.mapTileOptions))
    this.rxState.mapTileOptions.sendMessage(newMapTileOptions)
  }

  saveEquipmentPropertiesToRender () {
    this.props.configuration.networkEquipment.labelDrawingOptions.properties = JSON.parse(this.state.equipmentPropertiesToRender)
    this.rxState.viewSettingsChanged.sendMessage()
    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }
}

const mapStateToProps = (state) => ({
  viewSetting: state.toolbar.viewSetting,
  viewFiberOptions: state.toolbar.viewFiberOptions,
  configuration: state.toolbar.appConfiguration,
})

const mapDispatchToProps = (dispatch) => ({
  setViewSetting: (viewSetting) => dispatch(ToolBarActions.setViewSetting(viewSetting))
})

const ViewSettingsComponent = connect(mapStateToProps, mapDispatchToProps)(ViewSettings)
export default ViewSettingsComponent
