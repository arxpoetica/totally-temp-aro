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
      morphologyTileInfos: []
    }
  }

  render() {

    const {tileInfo, morphologyTileInfos} = this.state

    return (
      <div className="aro-debug-container ">
        {/* <!-- A button to get debugging info on all the selected service areas --> */}
        <button className="btn btn-block btn-light"
                style={{flex: '0 0 auto'}}
                onClick={(e)=>this.getMorphologyTileInfoForSelectedServiceAreas(e)}>
          Get tile info for all selected service areas
        </button>

        <ViewSettings/>

        <table className="table table-sm table-striped">
          <tbody>
            <tr>
              <td>
                <input className="form-control" type="number" name='z' value={tileInfo.z} onChange={(e)=>this.tileInfoChange(e)} placeholder="Zoom(Z)"/>
              </td>
              <td>
                <input className="form-control" type="number" name='x' value={tileInfo.x} onChange={(e)=>this.tileInfoChange(e)} placeholder="X"/>
              </td>
              <td>
                <input className="form-control" type="number" name='y' value={tileInfo.y} onChange={(e)=>this.tileInfoChange(e)} placeholder="Y"/>
              </td>
            </tr>
          </tbody>
        </table>

        <button className="btn btn-block btn-light" style={{flex: '0 0 auto'}} 
          onClick={(e)=>this.getTileBoundsInfo(e)}>
          Get tile Bounds Info
        </button>

        {tileInfo.bounds &&
          <div style={{flex: '0 0 auto', overflowY: 'auto'}}>
            {/* <!-- Display the array of debugging infos --> */}
            <div className="list-group">
              <div style={{whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '10px'}}>{tileInfo.bounds}</div>
            </div>
          </div>
        }

        {/* <!-- A container to display all the debugging info on the selected service areas --> */}
        <div style={{flex: '1 1 auto', overflowY: 'auto'}}>
          {/* <!-- Display the array of debugging infos --> */}
          <div className="list-group">
          {morphologyTileInfos.map((morphologyTile, index) => {
            return (
              <div key={index}>
                <h4>{morphologyTile.url}</h4>
                <div style={{whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '10px'}}>{morphologyTile.info}</div>
              </div>
            )}
          )}
          </div>
        </div>
      </div>
    )
  }

  getTileBoundsInfo () {

    let tileInfoBounds = JSON.stringify(MapUtilities.getTileLatLngBounds(this.state.tileInfo.z, this.state.tileInfo.x, this.state.tileInfo.y), undefined, 2)

    let tileInfo = this.state.tileInfo;
    tileInfo['bounds'] = tileInfoBounds;
    this.setState({tileInfo: tileInfo})
  }

  tileInfoChange (e) {
    var tileInfo = this.state.tileInfo
    tileInfo[e.target.name] = e.target.value

    this.setState({tileInfo: tileInfo})
  }

  getMorphologyTileInfoForSelectedServiceAreas () {
    // For all selected service areas, gets the morphology tile debugging info from aro-service
    var tileInfoPromises = []
    this.props.planTargetServiceAreas.forEach((serviceAreaId) => {
      tileInfoPromises.push(AroHttp.get(`/service/v1/tile-system-cmd/check_service_area/${serviceAreaId}`))
    })

    // Get debugging info for all tiles from aro-service
    Promise.all(tileInfoPromises)
    .then((results) => {
      var morphologyTileInfos = []
      results.forEach((result) => {
        morphologyTileInfos.push({
          url: result.config.url,
          info: JSON.stringify(result.data, null, 2)
        })
        this.setState({morphologyTileInfos: morphologyTileInfos})
      })
    })
    .catch((err) => {
      var morphologyTileInfos = []
      morphologyTileInfos = [
        {
          url: 'Error',
          info: JSON.stringify(err, null, 2)
        }
      ]
      this.setState({morphologyTileInfos: morphologyTileInfos})
    })
  }
}

const mapStateToProps = (state) => ({
  planTargetServiceAreas: state.selection.planTargets.serviceAreas,
})  

const mapDispatchToProps = (dispatch) => ({
})

const AroDebugComponent = wrapComponentWithProvider(reduxStore, AroDebug, mapStateToProps, mapDispatchToProps)
export default AroDebugComponent