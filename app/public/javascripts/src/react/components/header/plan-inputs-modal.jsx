import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import ToolBarActions from './tool-bar-actions'
import EditPlanTag from './edit-plan-tag.jsx'

export class PlanInputsModal extends Component {
  constructor (props) {
    super(props)

    this.props.loadListOfPlanTags()

    this.state = {
      planName: '',
      parentPlan: null,
      planType: 'UNDEFINED',
      currentPlan: {},
      parentPlanSelectorExpanded: false,
      planTypes: {}
    }

    this.allPlanTypes = {
      UNDEFINED: 'Standard Plan',
      NETWORK_PLAN: 'Network Build',
      NETWORK_ANALYSIS: 'Network Analysis',
      COVERAGE: 'Coverage Plan',
      MANUAL: 'Manual Plan',
      RFP: 'RFP',
      RING: 'Ring Plan'
    }
  }

  componentWillReceiveProps(nextProps) {
    // Trigger initModalData() when modal Show and Hide
    if(this.props.planInputsModal != nextProps.planInputsModal) {
      if(nextProps.planInputsModal === true) {
        this.initModalData()
      } else {
        this.initModalData()
      }
    }
  }

  render() {

    const {planInputsModal, listOfTags, currentPlanTags,
          listOfServiceAreaTags, currentPlanServiceAreaTags, dataItems} = this.props
    const {planName, planType, planTypes} = this.state

    return(
      <div>
        <Modal isOpen={planInputsModal} size='lg' style={{width: '350px'}}>
          <ModalHeader toggle={(e) => this.close()}>Plan Inputs</ModalHeader>
          <ModalBody>
            {/* Plan name */}
            <input type="text" id="searchPlanName" className="form-control with-margin"
            onChange={(e)=> this.onChangePlanName(e)} value={planName} placeholder="Plan Name"/>

            {/* Plan type */}
            <select className="form-control with-margin" value={planType}
              onChange={(e)=> this.onChangePlanType(e)}>
              {
                Object.entries(planTypes).map(([ objKey, objValue ], objIndex) => {
                  return (
                    <option key={objIndex} value={objKey} label={objValue}></option>
                  )
                })
              }
            </select>

            {/* Plan tags */}
            <div className="with-margin">
              <EditPlanTag
                objectName="Tag"
                searchList={listOfTags}
                selectedList={currentPlanTags}
              />
            </div>
            <EditPlanTag
              objectName="Service Area"
              searchList={listOfServiceAreaTags}
              selectedList={currentPlanServiceAreaTags}
              refreshTagList={this.props.loadListOfSAPlanTags(dataItems)}
            />
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-primary" onClick={(e) => this.savePlanAs()}>Create Plan</button>
            <button className="btn btn-danger float-right" onClick={(e) => this.close()}>Cancel</button>
          </ModalFooter>
        </Modal>
      </div>
    )
  }

  onChangePlanName (e) {
    this.setState({planName: e.target.value})
  }

  onChangePlanType (e) {
    this.setState({planType: e.target.value})
  }

  initModalData () {
    const currentPlan = this.props.plan
    if (currentPlan && !currentPlan.ephemeral) {
      // IF the current plan is not an ephemeral plan, then set it as the parent plan.
      this.setState({parentPlan: currentPlan})
    }

    var allPlanTypes = []
    var allowedPlanTypes = []
    let planTypes = {}
    try {
      allPlanTypes = this.props.configuration.plan.allPlanTypes
      allowedPlanTypes = this.props.configuration.plan.allowedPlanTypes
      allowedPlanTypes.forEach(allowedPlanType => { 
        planTypes[allowedPlanType] = allPlanTypes[allowedPlanType] 
        this.setState({planTypes: planTypes})
      })
    } catch (err) {
      console.error('Error when determining the list of plan types to display. Plan configuration is:')
      console.error(this.props.configuration.plan)
      console.error(err)
    }
  }

  close () {
    this.props.setPlanInputsModal(false)
  }

  savePlanAs () {
    this.resetPlanInputs()
  }

  resetPlanInputs () {
    this.props.setPlanInputsModal(false)
  }
}


const mapStateToProps = (state) => ({
  planInputsModal: state.toolbar.planInputsModal,
  plan: state.plan.activePlan,
  configuration: state.toolbar.appConfiguration,
  listOfTags: state.toolbar.listOfTags,
  currentPlanTags: state.toolbar.currentPlanTags,
  dataItems: state.plan.dataItems,
  listOfServiceAreaTags: state.toolbar.listOfServiceAreaTags,
  currentPlanServiceAreaTags: state.toolbar.currentPlanServiceAreaTags,

})  

const mapDispatchToProps = (dispatch) => ({
  setPlanInputsModal: (status) => dispatch(ToolBarActions.setPlanInputsModal(status)),
  loadListOfPlanTags: () => dispatch(ToolBarActions.loadListOfPlanTags()),
  loadListOfSAPlanTags: (dataItems) => dispatch(ToolBarActions.loadListOfSAPlanTags(dataItems))
})

const PlanInputsModalComponent = wrapComponentWithProvider(reduxStore, PlanInputsModal, mapStateToProps, mapDispatchToProps)
export default PlanInputsModalComponent