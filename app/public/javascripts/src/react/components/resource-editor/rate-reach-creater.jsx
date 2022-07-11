import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class RateReachManager extends Component {
  constructor (props) {
    super(props)
    this.state = {
      rateReachManager: {
        category:'SPEED',
        name:'New Rate Reach Manager',
        description:'New Rate Reach Manager Description'
      }
  	}

    this.categoryTypes = [
      { id: 'SPEED', description: 'Speeds' },
      { id: 'BAND', description: 'Speed Bands' }
    ]
  }

  componentDidMount () {
    if (this.props.cloneManager && this.props.cloneManager.id) {
      this.props.reloadRateReachManagerConfiguration(this.props.cloneManager.id, this.props.loggedInUser)
    }
    this.props.setModalTitle('Create Rate Reach Manager')
  }

  render () {
    /*
    return (this.categoryTypes === null || 
      this.props.rateReachManagerConfigs === undefined ||
      this.props.rateReachManagerConfigs.rateReachConfig === undefined
    )
    ? null
    : this.renderRateReachManager()
    */
    return this.renderRateReachManager()
  }  

  renderRateReachManager () {
    return (
      <>
        <div style={{display: 'flex', flexDirection: 'column', height: '90%'}}>
          <div style={{flex: '1 1 auto'}}>
            <form className="form-horizontal form-rr-creator">
              {/* The source rate reach manager used when cloning */}
              {this.props.cloneManager &&
                <div className="form-group row">
                  <label className="col-sm-4 control-label">Rate Reach Manager to clone</label>
                  <div className="col-sm-8">
                    <input className="form-control" disabled value={this.props.cloneManager.name}/>
                  </div>
                </div>
              }

              {/* The name of the new rate reach manager  */}
              <div className="form-group row">
                <label className="col-sm-4 control-label">Name</label>
                <div className="col-sm-8">
                  <input className="form-control" name="name" value={this.state.rateReachManager.name} 
                    onChange={(e)=>this.handleChange(e)}/>
                </div>
              </div>

              {/* <!-- The description of the new rate reach manager --> */}
              <div className="form-group row">
                <label className="col-sm-4 control-label">Description</label>
                <div className="col-sm-8">
                  <input className="form-control" name="description" value={this.state.rateReachManager.description} 
                    onChange={(e)=>this.handleChange(e)}/>
                </div>
              </div>

              {/* <!-- The category type of the new rate reach manager --> */}
              <div className="form-group row">
                <label className="col-sm-4 control-label">Category Type</label>
                <div className="col-sm-8">
                  <select id="cboCategoryTypes" disabled={this.props.cloneManager}  className="form-control" name="category" 
                    onChange={(e)=>this.handleChange(e)} 
                    value={this.props.rateReachManagerConfigs && this.props.rateReachManagerConfigs.rateReachConfig ? this.props.rateReachManagerConfigs.rateReachConfig.categoryType : undefined}> 
                    {this.categoryTypes.map(item => <option value={item.id} key={item.id}>{item.description}</option>)}
                  </select>
                </div>
              </div>
          	</form>
          </div>

          <div style={{flex: '0 0 auto'}}>
            <div style={{textAlign: 'right'}}>
              <button className="btn btn-light mr-2" onClick={() => this.handleBack()}>
                <i className="fa fa-undo action-button-icon"></i>Back
              </button>
              <button className="btn btn-primary" onClick={() => this.handleCreateRateReachManager()}>
                <i className="fa fa-save action-button-icon"></i>Create
              </button>
            </div>
          </div>
       </div>
      </>
  	)
  }

  handleChange (e) {
    let rateReachManager = this.state.rateReachManager;
    rateReachManager[e.target.name] = e.target.value;
    this.setState({ rateReachManager: rateReachManager });  
  }

  handleBack(){
    this.props.setIsResourceEditor(true);
  }

  handleCreateRateReachManager(){
    var rateReachManager = { ...this.state.rateReachManager }
    // rateReachManager.category = this.props.rateReachManagerConfigs.rateReachConfig.categoryType
    let cloneManager = this.props.cloneManager;
    let loggedInUser = this.props.loggedInUser;
    this.props.createRateReachManager(rateReachManager, cloneManager, loggedInUser);
  }
}

	const mapStateToProps = (state) => ({
    loggedInUser: state.user.loggedInUser,
    rateReachManagerConfigs: state.resourceEditor.rateReachManagerConfigs
	})   

	const mapDispatchToProps = (dispatch) => ({
		getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
		searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
    createRateReachManager: (rateReachManager, cloneManager, loggedInUser) => dispatch(ResourceActions.createRateReachManager(rateReachManager, cloneManager, loggedInUser)),
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
    reloadRateReachManagerConfiguration: (rateReachManagerId, loggedInUser) => dispatch(ResourceActions.reloadRateReachManagerConfiguration(rateReachManagerId, loggedInUser))
	})

const RateReachManagerCreatorComponent = connect(mapStateToProps, mapDispatchToProps)(RateReachManager)
export default RateReachManagerCreatorComponent
