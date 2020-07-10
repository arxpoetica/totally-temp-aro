import React, { Component } from 'react'
import { connect } from 'react-redux'
import AroObjectEditor from './aro-object-editor.jsx'

export class ConicTileSystem extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }

    this.handleTileSystem = this.handleTileSystem.bind(this)

    this.tileSystemParams = {
      conicSystem: {
        code: 'EPSG:5070',
        srid: 5070
      },
      cellSize: 30,
      systemOriginX: '-96.0009191593717',
      systemOriginY: '23.0002109131773',
      tileWidth: 300
    }

    this.props.onTileSystemChange(this.tileSystemParams)
  }

  render () {
    return this.renderConicTileSystem()
  }

  renderConicTileSystem()  {
    return (
       <>
        <div className="form-group row">
          <label className="col-sm-4 col-form-label">Dataset name</label>
          <div className="col-sm-8">
            <input className="form-control" onChange={(e)=>this.handleDataSet(e)} value={this.state.dataSourceName} name="dataSourceName"/>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-4 col-form-label">Dataset</label>
          <div className="col-sm-8">
            <input id="conicTileSystemFile" type="file" onChange={event => this.handleUpload(event)} name="dataset" className="form-control"/>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-4 col-form-label">Tile System Parameters</label>
          <div className="col-sm-8">
            <AroObjectEditor 
              objectToEdit={this.tileSystemParams}
              onTileSystemChange={this.handleTileSystem}/>
          </div>
        </div>
        { this.props.isUploading && 
          <div style={{position: 'absolute', top: '0px', left: '0px', right: '0px', bottom: '0px', backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '20px'}}>
              <span style={{fontSize: '20px'}}>Building tile system on the server.<br/>This can take a few minutes</span>
            </div>
          </div>  
        }
      </>
    )
  }

  handleTileSystem(tileSystemData){
    this.props.onTileSystemChange(tileSystemData)
  }

  handleDataSet(e){
    this.props.onDatasetChange(e)
  }

  handleUpload(e){
    this.props.onDatasetUpload(e)
  }
}

  const mapStateToProps = (state) => ({
    isUploading: state.dataUpload.isUploading,
  })   

  const mapDispatchToProps = (dispatch) => ({
  })

const ConicTileSystemComponent = connect(mapStateToProps, mapDispatchToProps)(ConicTileSystem)
export default ConicTileSystemComponent