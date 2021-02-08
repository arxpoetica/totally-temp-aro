import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import ViewSettings from './view-settings.jsx'
import MapUtilities from '../../../../components/common/plan/map-utilities'
import AroHttp from '../../../common/aro-http'
import '../sidebar.css'

export class AroDebug extends Component {
  constructor (props) {
    super(props)

    this.state = {
      tileInfo: {
        x: '',
        y: '',
        z: '',
        bounds: ''
      },
      morphologyTileInfos: [],
    }
  }

  render() {

    const { tileInfo, morphologyTileInfos } = this.state

    return (
      <div className="aro-debug-container" style={{overflowY: 'auto'}}>
        {/* A button to get debugging info on all the selected service areas */}
        <button
          className="btn btn-block btn-light"
          type="button"
          style={{flex: '0 0 auto'}}
          onClick={(event) => this.getMorphologyTileInfoForSelectedServiceAreas(event)}
        >
          Get tile info for all selected service areas
        </button>

        <ViewSettings />

        <table className="table table-sm table-striped">
          <tbody>
            <tr>
              <td>
                <input
                  className="form-control"
                  type="number" name='z'
                  value={tileInfo.z}
                  onChange={(event) => this.tileInfoChange(event)}
                  placeholder="Zoom(Z)"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="number" name='x'
                  value={tileInfo.x}
                  onChange={(event) => this.tileInfoChange(event)}
                  placeholder="X"
                />
              </td>
              <td>
                <input
                  className="form-control"
                  type="number" name='y'
                  value={tileInfo.y}
                  onChange={(event) => this.tileInfoChange(event)}
                  placeholder="Y"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <button
          className="btn btn-block btn-light"
          style={{flex: '0 0 auto'}}
          type="button"
          onClick={(event) => this.getTileBoundsInfo(event)}
        >
          Get tile Bounds Info
        </button>

        {tileInfo.bounds &&
          <div style={{flex: '0 0 auto', overflowY: 'auto'}}>
            {/* Display the array of debugging infos */}
            <div className="list-group">
              <div style={{whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '10px'}}>
                {tileInfo.bounds}
              </div>
            </div>
          </div>
        }

        {/* A container to display all the debugging info on the selected service areas */}
        <div
          style={morphologyTileInfos.length > 0
          ? {flex: '0 0 25em', overflow: 'auto'}
          : {flex: '0 0 auto', overflow: 'auto'}}
        >
          {/*  Display the array of debugging infos */}
          <div className="list-group">
            {morphologyTileInfos.map((morphologyTile, index) => {
              return (
                <div key={index}>
                  <h4>{morphologyTile.url}</h4>
                  <div style={{whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '10px'}}>
                    {morphologyTile.info}
                  </div>
                </div>
              )}
            )}
          </div>
        </div>
      </div>
    )
  }

  getTileBoundsInfo () {
    const tileInfoBounds = JSON.stringify(
      MapUtilities.getTileLatLngBounds(
        this.state.tileInfo.z, this.state.tileInfo.x, this.state.tileInfo.y
      ), undefined, 2
    )
    const tileInfo = this.state.tileInfo
    tileInfo['bounds'] = tileInfoBounds
    this.setState({ tileInfo })
  }

  tileInfoChange (event) {
    const tileInfo = this.state.tileInfo
    tileInfo[event.target.name] = event.target.value
    this.setState({ tileInfo })
  }

  getMorphologyTileInfoForSelectedServiceAreas () {
    // For all selected service areas, gets the morphology tile debugging info from aro-service
    const tileInfoPromises = []
    this.props.planTargetServiceAreas.forEach((serviceAreaId) => {
      tileInfoPromises.push(AroHttp.get(`/service/v1/tile-system-cmd/check_service_area/${serviceAreaId}`))
    })

    // Get debugging info for all tiles from aro-service
    Promise.all(tileInfoPromises)
      .then((results) => {
        const morphologyTileInfos = []
        results.forEach((result) => {
          const requestUrl = new URL(result.url)
          morphologyTileInfos.push({
            url: requestUrl.pathname,
            info: JSON.stringify(result.data, null, 2)
          })
          this.setState({ morphologyTileInfos })
        })
      })
      .catch((err) => {
        let morphologyTileInfos = []
        morphologyTileInfos = [
          {
            url: 'Error',
            info: JSON.stringify(err, null, 2)
          }
        ]
        this.setState({ morphologyTileInfos })
      })
  }
}

const mapStateToProps = (state) => ({
  planTargetServiceAreas: state.selection.planTargets.serviceAreas,
})

const AroDebugComponent = wrapComponentWithProvider(reduxStore, AroDebug, mapStateToProps, null)
export default AroDebugComponent
