import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import ToolBarActions from './tool-bar-actions'
import EditPlanTag from './edit-plan-tag.jsx'
import PlanSearch from './plan-search.jsx'
import AroHttp from '../../common/aro-http'

export class PlanInputsModal extends Component {
  constructor (props) {
    super(props)

    this.props.loadListOfPlanTags()
    this.props.loadListOfSAPlanTags(this.props.dataItems)

    this.state = {
      planName: '',
      parentPlan: null,
      planType: 'UNDEFINED',
      parentPlanSelectorExpanded: false,
      planTypes: {},
    }

    this.allPlanTypes = {
      UNDEFINED: 'Standard Plan',
      NETWORK_PLAN: 'Network Build',
      NETWORK_ANALYSIS: 'Network Analysis',
      COVERAGE: 'Coverage Plan',
      MANUAL: 'Manual Plan',
      RFP: 'RFP',
      RING: 'Ring Plan',
    }
  }

  // To trigger initModalData() when planInputsModal props change
  // And if active plan has changed update the plan object
  componentDidUpdate(prevProps) {
    // Trigger initModalData() when modal Show and Hide
    if (this.props.planInputsModal !== prevProps.planInputsModal) {
      if (this.props.planInputsModal === true) {
        this.initModalData()
      } else {
        this.initModalData()
      }
    }

    const currentActivePlanId = prevProps.plan && prevProps.plan.id
    const newActivePlanId = this.props.plan && this.props.plan.id

    if ((currentActivePlanId !== newActivePlanId) && (prevProps.plan)) {
      // The active plan has changed.
      // Note that we are comparing ids because a change in plan state also causes the plan object to update.
      this.onActivePlanChanged(this.props.plan)
    }
  }

  render() {

    const { planInputsModal, listOfTags, currentPlanTags, listOfServiceAreaTags,
      currentPlanServiceAreaTags, systemActors } = this.props
    const { planName, planType, planTypes, parentPlanSelectorExpanded, parentPlan } = this.state

    return (
      <div>
        <Modal isOpen={planInputsModal} size="lg" style={{width: '350px'}}>
          <ModalHeader toggle={() => this.close()}>Plan Inputs</ModalHeader>
          <ModalBody>
            {/* Plan name */}
            <input
              type="text"
              id="searchPlanName"
              className="form-control with-margin"
              onChange={(event) => this.onChangePlanName(event)}
              value={planName} placeholder="Plan Name"
            />

            {/* Plan type */}
            <select className="form-control with-margin" value={planType}
              onChange={(event) => this.onChangePlanType(event)}>
              {
                Object.entries(planTypes).map(([objKey, objValue], objIndex) => {
                  return (
                    <option key={objIndex} value={objKey} label={objValue} />
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
              refreshTagList={this.onRefreshTagList.bind(this)}
            />

            {/* Parent plan selector - header */}
            <div
              onClick={() => this.toggleParentPlanSelectorExpanded()}
              style={{marginTop: '10px', cursor: 'pointer'}}
            >
              Parent plan: {parentPlan ? parentPlan.name : '(undefined)'}&nbsp;
              <button
                className="btn btn-thin btn-light"
                onClick={(event) => this.clearParentPlan(event)}
              >
                Clear
              </button>
              <div className="float-right">
                <i className={`btn ${!parentPlanSelectorExpanded ? 'fa fa-plus' : 'fa fa-minus'}`} />
              </div>
            </div>

            {/* Parent plan selector - expandable body */}
            <div
              className="parent-plan-selector-body"
              style={{ display: parentPlanSelectorExpanded ? 'block' : 'none',
              marginLeft: '30px', maxHeight: '200px', overflowY: 'auto', width: '285px'
             }}
            >
              {parentPlanSelectorExpanded &&
                <PlanSearch
                  showPlanDeleteButton={false}
                  systemActors={systemActors}
                  onPlanSelected={this.onParentPlanSelected.bind(this)}
                  currentView="savePlanSearch"
                />
              }
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-primary" onClick={() => this.savePlanAs()}>Create Plan</button>
            <button className="btn btn-danger float-right" onClick={() => this.close()}>Cancel</button>
          </ModalFooter>
        </Modal>
      </div>
    )
  }

  onRefreshTagList (dataItems, filterObj, isHardReload) {
    this.props.loadListOfSAPlanTags(dataItems, filterObj, isHardReload)
  }

  onActivePlanChanged (plan) {
    this.props.setCurrentPlanTags(this.props.listOfTags.filter(tag => _.contains(plan.tagMapping.global, tag.id)))
    this.props.setCurrentPlanServiceAreaTags(this.props.listOfServiceAreaTags.filter(tag => _.contains(plan.tagMapping.linkTags.serviceAreaIds, tag.id)))
  }

  onParentPlanSelected (plan) {
    this.setState({ parentPlan: plan.plan, parentPlanSelectorExpanded: false })
  }

  toggleParentPlanSelectorExpanded () {
    this.setState({ parentPlanSelectorExpanded: !this.state.parentPlanSelectorExpanded })
  }

  clearParentPlan (event) {
    event.stopPropagation()
    this.setState({ parentPlan: null })
  }

  onChangePlanName (event) {
    this.setState({ planName: event.target.value })
  }

  onChangePlanType (event) {
    this.setState({ planType: event.target.value })
  }

  initModalData () {
    this.setState({ planName: '', parentPlan: null, planType: 'UNDEFINED', parentPlanSelectorExpanded: false })
    const currentPlan = this.props.plan
    if (currentPlan && !currentPlan.ephemeral) {
      // IF the current plan is not an ephemeral plan, then set it as the parent plan.
      this.setState({ parentPlan: currentPlan })
    }
    let allPlanTypes = []
    let allowedPlanTypes = []
    let planTypes = {}
    try {
      allPlanTypes = this.props.configuration.plan.allPlanTypes
      allowedPlanTypes = this.props.configuration.plan.allowedPlanTypes
      allowedPlanTypes.forEach(allowedPlanType => {
        planTypes[allowedPlanType] = allPlanTypes[allowedPlanType]
        this.setState({ planTypes })
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
    this.checkIfSATagExists()
      .then((saTagExists) => {
        if (saTagExists) return this.checkIfPlanNameExists()
      })
      .then((planNameExists) => {
        if (!planNameExists) {
          if (this.state.parentPlan) {
            // A parent plan is specified. Ignore the currently open plan, and just create a new one using
            // the selected plan name and parent plan
            this.props.createNewPlan(false, this.state.planName, this.state.parentPlan, this.state.planType)
              .then((result) => this.props.loadPlan(result.data.id))
              .catch((err) => console.error(err))
          } else {
          // No parent plan specified
            const currentPlan = this.props.plan
            if (currentPlan.ephemeral) {
              if (this.state.planName) {
                this.props.makeCurrentPlanNonEphemeral(this.state.planName, this.state.planType)
                this.resetPlanInputs()
              }
            } else {
              if (this.state.planName) {
                this.props.copyCurrentPlanTo(this.state.planName, this.state.planType)
                this.resetPlanInputs()
              }
            }
          }
          this.close()
        }
      })
  }

  checkIfSATagExists () {
    return new Promise((resolve) => {
      // For frontier client check for atleast one SA tag selected
      if (this.props.configuration.ARO_CLIENT === 'frontier') {
        if (this.props.currentPlanServiceAreaTags.length <= 0) {
          swal({
            title: 'Service Area Tag is Required',
            text: 'Select Atleast One Service Area Tag',
            type: 'error'
          })
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    })
  }

  checkIfPlanNameExists () {
    return new Promise((resolve) => {
      // For frontier client check for duplicate plan name
      if (this.props.configuration.ARO_CLIENT === 'frontier') {
        const filter = `(name eq '${this.state.planName.replace(/'/g, "''")}') and (ephemeral eq false)`
        return AroHttp.get(`/service/odata/PlanSummaryEntity?$select=id,name&$filter=${encodeURIComponent(filter)}&$top=20`)
          .then((result) => {
            if (result.data.length > 0) {
              swal({
                title: 'Duplicate Plan Name',
                text: 'Plan name already exists, please enter a unique plan name',
                type: 'error'
              })
            } else {
              resolve(false)
            }
          })
      } else {
        resolve(false)
      }
    })
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
  systemActors: state.user.systemActors,
})

const mapDispatchToProps = (dispatch) => ({
  setPlanInputsModal: (status) => dispatch(ToolBarActions.setPlanInputsModal(status)),
  loadListOfPlanTags: () => dispatch(ToolBarActions.loadListOfPlanTags()),
  loadListOfSAPlanTags: (dataItems, filterObj, isHardReload) => dispatch(ToolBarActions.loadListOfSAPlanTags(dataItems, filterObj, isHardReload)),
  createNewPlan: (value, planName, parentPlan, planType) => dispatch(ToolBarActions.createNewPlan(value, planName, parentPlan, planType)),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
  makeCurrentPlanNonEphemeral: (planName, planType) => dispatch(ToolBarActions.makeCurrentPlanNonEphemeral(planName, planType)),
  copyCurrentPlanTo: (planName, planType) => dispatch(ToolBarActions.copyCurrentPlanTo(planName, planType)),
  setCurrentPlanTags: (currentPlanTags) => dispatch(ToolBarActions.setCurrentPlanTags(currentPlanTags)),
  setCurrentPlanServiceAreaTags: (currentPlanServiceAreaTags) => dispatch(
    ToolBarActions.setCurrentPlanServiceAreaTags(currentPlanServiceAreaTags)
  ),
})

const PlanInputsModalComponent = connect(mapStateToProps, mapDispatchToProps)(PlanInputsModal)
export default PlanInputsModalComponent
