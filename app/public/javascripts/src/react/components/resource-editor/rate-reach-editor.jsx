import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class RateReachEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }  

  componentDidMount () {
    this.props.reloadRateReachManagerConfiguration(this.props.resourceManagerId, this.props.loggedInUser); 
  }

  componentWillReceiveProps(nextProps){
  }

  render () {

    return this.props.rateReachManager === undefined || this.props.rateReachManagerConfig === undefined
    ? null
    : this.renderRateReachEditor()
  }

  renderRateReachEditor()  {

    console.log(this.props.rateReachManager)
    console.log(this.props.rateReachManagerConfig)
    
    return (
      <div>
        <h4>{this.props.resourceManagerName} </h4>
      </div>
    )
  }

  exitEditingMode(){
    this.props.setIsResourceEditor(true);
  }

  saveConfigurationToServer(){
  }
}

  const mapStateToProps = (state) => ({
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
    loggedInUser: state.user.loggedInUser,
    rateReachManager: state.resourceEditor.rateReachManager,
    rateReachManagerConfig: state.resourceEditor.rateReachManagerConfig,
  })   

  const mapDispatchToProps = (dispatch) => ({
    reloadRateReachManagerConfiguration: (rateReachManagerId, loggedInUser) => dispatch(ResourceActions.reloadRateReachManagerConfiguration(rateReachManagerId, loggedInUser)),
  })

const RateReachEditorComponent = connect(mapStateToProps, mapDispatchToProps)(RateReachEditor)
export default RateReachEditorComponent