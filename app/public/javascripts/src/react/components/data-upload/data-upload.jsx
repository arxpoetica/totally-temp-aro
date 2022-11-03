import React, { Component, Fragment } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import EtlTemplateActions from '../etl-templates/etl-templates-actions'
import DataUploadActions from './data-upload-actions'
import EtlTemplates from '../etl-templates/etl-templates.jsx'
import ResourcePermission from '../acl/resource-permissions/resource-permissions.jsx'
import ConicTileSystem from './conic-tile-system-uploader.jsx'

export class DataUpload extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataSourceName: '',
      selectedDataSourceName: '',
      selectedDataTypeId:'',
      selectedConduitSize: '',
      selectedSpatialEdgeType:'',
      selectedCreationType:'upload_file',
      selectedCableType:'',
      selectedEquipment:'',
      radius:20000,
      file:null,
      editedTileSystemData : ''
    }
    this.props.loadMetaData()
    this.handleDataSource = this.handleDataSource.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleTileSystem = this.handleTileSystem.bind(this)
  }

  componentDidMount(){
    this.props.loadEtlTemplatesFromServer(this.state.selectedDataTypeId)
    this.props.toggleView('FileUpload')
  }

  static getDerivedStateFromProps(nextProps, prevState) { // ToDo: replace this with selectors in mapStateToProps
  
    if(prevState.selectedDataSourceName !== undefined && nextProps.selectedDataSourceName !== undefined
       && nextProps.spatialEdgeTypes.length > 0 && nextProps.conduitSizes !== null) {
			if(prevState.selectedDataSourceName === ''){
				return {
          selectedDataSourceName: nextProps.selectedDataSourceName,
          selectedDataTypeId: nextProps.selectedDataTypeId,
          selectedSpatialEdgeType: nextProps.spatialEdgeTypes[0].name,
          selectedConduitSize: nextProps.conduitSizes[0].id
				};
			} else {
				return {
          selectedDataSourceName: prevState.selectedDataSourceName,
          selectedDataTypeId: prevState.selectedDataTypeId,
          selectedSpatialEdgeType: prevState.selectedSpatialEdgeType,
          selectedConduitSize: prevState.selectedConduitSize
				}
			}
		} else {
      return null
    }
  }
  
  dataTypeChange(event) {
    let selectedDataSourceName = ''
    let dataId = parseInt(event.target.value);
    this.props.loadEtlTemplatesFromServer(dataId)
    this.props.dataTypes.forEach((data) => {
      if(data.id === dataId){
        selectedDataSourceName = data.name;
      }
    })
    this.setState({selectedDataTypeId: event.target.value, selectedDataSourceName: selectedDataSourceName})

    if(this.props.spatialEdgeTypes.length > 0 && this.props.conduitSizes !== null && 
      this.props.saCreationTypes !== null && this.props.cableTypes.length > 0 && 
      this.props.equipmentTypes !== null){
      
      let selectedSpatialEdgeType = this.props.spatialEdgeTypes[0].name;
      let selectedConduitSize = this.props.conduitSizes[0].id;
      let selectedCableType = this.props.cableTypes[0].name;
      let selectedCreationType = this.props.saCreationTypes[0].id;
      let selectedEquipment = '';
      if(this.props.equipmentTypes.length >0){
        selectedEquipment = this.props.equipmentTypes[0].identifier;
      }

      this.setState({selectedConduitSize:selectedConduitSize,selectedSpatialEdgeType:selectedSpatialEdgeType,
        selectedCreationType: selectedCreationType,selectedCableType:selectedCableType,selectedEquipment:selectedEquipment})
      
    }
  }

  spatialEdgeChange(event) {
    this.setState({selectedSpatialEdgeType: event.target.value})
  }

  conduitSizeChange(event) {
    this.setState({selectedConduitSize: event.target.value})
  }

  cableTypeChange(event) {
    this.setState({selectedCableType: event.target.value})
  }

  creationTypeChange(event) {
    this.setState({selectedCreationType: event.target.value})
  }

  equipmentChange(event) {
    this.setState({selectedEquipment: event.target.value})
  }

  handleDataSource (event) {
    let fieldValue = event.target.value;
    this.setState({ dataSourceName: fieldValue });
  }

  handleRadius (event) {
    let fieldValue = event.target.value;
    this.setState({ radius: fieldValue });
  }

  handleUpload (event) {
    event.preventDefault();
    let file = event.target.files[0];
    this.setState({ file: file })
  }

  handleTileSystem(tileSystemData){
    this.setState({ editedTileSystemData: tileSystemData })
  }

  save (){
    this.props.saveDataSource(this.state,this.props.loggedInUser)
    this.props.onSave()
  }

  render () {
    return this.props.isFileUpload
    ? <>{this.renderFileUpload()}</>
    : <>{this.renderDataManagement()}</>
  }

  renderFileUpload () {

    let dataTypesOptions = []
    this.props.dataTypes.forEach((item) => {
      dataTypesOptions.push(<option value={item.id} key={item.name} >{item.description}</option>)
    })

    // TODO: Technical debt
    // As of 2nd, Nov 2020 we do not have map between aro.edge_connectivity_type and aro_core.data_type
    // For now the to get featuretype and subfeature type for datatype we have to use
    // edeg connectivity endpoints. To make it work 
    // we have to put in a briging login between those entities to fill the feature type
    // edge = conduit
    // copper_cable = copper
    // fiber = cable
    let spatialEdgeOptions = []
    let currentSubTypes = this.props.spatialEdgeTypes.filter(item => item.edgeConnectivityType == "conduit")
    currentSubTypes.forEach((item) => {
      spatialEdgeOptions.push(<option value={item.name} key={item.name} >{item.description}</option>)
    })
    let cableOptions = []
    let cableTypes = this.props.cableTypes.filter(item => item.edgeFeatureType.edgeConnectivityType == "cable")
    cableTypes.forEach((item) => {
      cableOptions.push(<option value={item.name} key={item.name} >{item.description}</option>)
    })
    
    let conduitOptions = []
    this.props.conduitSizes.forEach((item) => {
      conduitOptions.push(<option value={item.id} key={item.name} >{item.description}</option>)
    })



    let creationTypeOptions = []
    this.props.saCreationTypes.forEach((item) => {
      creationTypeOptions.push(<option value={item.id} key={item.id} >{item.label}</option>)
    })

    let equipmentTypeOptions = []
    this.props.equipmentTypes.forEach((item,index) => {
      equipmentTypeOptions.push(<option value={item.identifier} key={index} >{item.name}</option>)
    })

    return (
      <div className="form-horizontal" id="data_source_upload_modal" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{flex: '0 0 auto'}}>
          <div className="form-group row">
            <div className="col-sm-8"></div>
            <div className="col-sm-4">
                <button onClick={() => this.props.toggleView('DataManagement')} className="btn btn-primary float-right" type="button" style={{marginRight:'15px'}}>Data Management</button>
            </div>
          </div>
        </div>

        <div style={{flex: '0 0 auto'}}>
        <div className="form-group row">
          <label className="col-sm-4 col-form-label">Data Type</label>
          <div className="col-sm-8">
          <select className="form-control" value={this.state.selectedDataTypeId} onChange={event => this.dataTypeChange(event)}>
            {dataTypesOptions}
          </select>
          </div>
        </div>

        <div>
          {this.state.selectedDataSourceName !== 'tile_system' &&
            <div className="form-group row">
              <label className="col-sm-4 col-form-label">Data Source Name</label>
              <div className="col-sm-8">
                <input type="text" onChange={(e)=>this.handleDataSource(e)} value={this.state.dataSourceName} name="dataSourceName" className="form-control" placeholder="Data Source Name"/>
              </div>
            </div>
          }

          { this.state.selectedDataSourceName === 'edge' &&
            <div>
              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Spatial Edge Type</label>
                <div className="col-sm-8">
                  <select className="form-control" value={this.state.selectedSpatialEdgeType} onChange={event => this.spatialEdgeChange(event)}>
                    {spatialEdgeOptions}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Default Conduit Size</label>
                <div className="col-sm-8">
                  <select className="form-control" value={this.state.selectedConduitSize} onChange={event => this.conduitSizeChange(event)}>
                    {conduitOptions}
                  </select>
                </div>
              </div>
            </div>
          }

          { this.state.selectedDataSourceName === 'fiber' &&
            <div className="form-group row">
              <label className="col-sm-4 col-form-label">Cable Type</label>
              <div className="col-sm-8">
                <select className="form-control" value={this.state.selectedCableType} onChange={event => this.cableTypeChange(event)}>
                  {cableOptions}
                </select>
              </div>
            </div>
          }

          { this.state.selectedDataSourceName === 'service_layer' &&
            <div className="form-group row">
              <label className="col-sm-4 col-form-label">Creation Type</label>
              <div className="col-sm-8">
                <select className="form-control" value={this.state.selectedCreationType} onChange={event => this.creationTypeChange(event)}>
                  {creationTypeOptions}
                </select>
              </div>
            </div>
          }

          { this.state.selectedDataSourceName !== 'tile_system' &&
            <>
              { (this.state.selectedDataSourceName !== 'service_layer' || this.state.selectedCreationType === 'upload_file') && 
                <div className="form-group row">
                  <label className="col-sm-4 col-form-label">File Location</label>
                  <div className="col-sm-8">
                    <input name="file" type="file" onChange={event => this.handleUpload(event)} className="form-control"/>
                  </div>
                </div>
              } 
            </>
          }         

          { this.state.selectedDataSourceName === 'service_layer' && this.state.selectedCreationType === 'polygon_equipment' &&
            <div>
              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Select Equipment layers</label>
                <div className="col-sm-8">
                  <select className="form-control" value={this.state.selectedEquipment} onChange={event => this.equipmentChange(event)}>
                    {equipmentTypeOptions}
                  </select>
                </div>
              </div>

              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Polygon radius (meters)</label>
                <div className="col-sm-8">
                  <input name="radius" type="number" value={this.state.radius} className="form-control" onChange={(e)=>this.handleRadius(e)} />
                </div>
              </div>
            </div>
          }
          </div>

          { (this.state.selectedDataSourceName === 'tile_system') && 
            <ConicTileSystem 
              onDatasetChange={this.handleDataSource}
              onDatasetUpload={this.handleUpload}
              onTileSystemChange={this.handleTileSystem}
            />
          }   
        </div>

        <div style={{flex: '1 1 auto'}}>
          <EtlTemplates />
        </div>
        <div style={{flex: '0 0 auto'}}>
          { this.state.dataSourceName === '' && 
            <button className="btn btn-light float-right" disabled={true}> Save </button>
          }
          { this.state.dataSourceName !== '' && 
            <button className="btn btn-primary float-right" disabled={this.props.isUploading} onClick={() => this.save ()} > 
              { this.props.isUploading && 
                <span className="fa fa-spinner fa-spin" style={{paddingRight:'8px'}}></span>
              }
              Save 
            </button>
          }
        </div>
      </div>
    )
  }

  renderDataManagement () {
    return(
      <div className="form-horizontal" id="data_source_upload_modal">
        <div className="form-group row">
          <div className="col-sm-8"></div>
          <div className="col-sm-4">
              <button onClick={() => this.handleFileUpload()} className="btn btn-primary float-right" type="button" style={{marginRight:'15px'}}> File Upload </button>
          </div>
        </div>
        <div>
          <ResourcePermission />
        </div>
      </div>
    )
  }

  handleFileUpload(){
    this.setState({dataSourceName: '', file: null})
    this.props.toggleView('FileUpload')
  }
}

const mapStateToProps = (state) => ({
  isDataManagement: state.dataUpload.isDataManagement,
  isFileUpload: state.dataUpload.isFileUpload,
  isUploading: state.dataUpload.isUploading,
  conduitSizes: state.dataUpload.conduitSizes,
  saCreationTypes: state.dataUpload.saCreationTypes,
  spatialEdgeTypes: state.dataUpload.spatialEdgeTypes,
  cableTypes: state.dataUpload.cableTypes,
  dataTypes: state.plan.uploadDataSources,
  etlTemplates: state.etlTemplates.etlTemplates,
  dataItems: state.plan.dataItems,
  equipmentTypes: state.plan.dataItems.equipment.allLibraryItems,
  loggedInUser: state.user.loggedInUser
})

const mapDispatchToProps = dispatch => ({
  loadMetaData: () => dispatch(DataUploadActions.loadMetaData()),
  loadEtlTemplatesFromServer: (dataType) => dispatch(EtlTemplateActions.loadEtlTemplatesFromServer(dataType)),
  toggleView: (viewName) => dispatch(DataUploadActions.toggleView(viewName)),
  saveDataSource: (uploadDetails,userId) => dispatch(DataUploadActions.saveDataSource(uploadDetails,userId))
})

const DataUploadComponent = wrapComponentWithProvider(reduxStore, DataUpload, mapStateToProps, mapDispatchToProps)
export default DataUploadComponent
