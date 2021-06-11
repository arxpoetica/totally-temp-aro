import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import '../plan-settings.css'
import PlanActions from '../plan-actions'
import ProjectTemplateActions from '../../project-template/project-template-actions'
import aclActions from '../../acl/acl-actions'
import ProjectPermissions from '../../project-template/project-permissions.jsx'
import {Modal, ModalHeader, ModalBody} from 'reactstrap';


export class PlanProjectConfig extends Component {
  constructor (props) {
    super(props)

    this.modes = Object.freeze({
      HOME: 'HOME',
      MANAGE_PROJECTS: 'MANAGE_PROJECTS',
      CREATE_PROJECT: 'CREATE_PROJECT',
      COPY_PROJECT_TO_PLAN: 'COPY_PROJECT_TO_PLAN',
      COPY_PLAN_TO_PROJECT: 'COPY_PLAN_TO_PROJECT'
    })

    this.state = {
      selectedMode: this.modes.HOME,
      newProjectName: 'New Project',
      parentProjectForNewProject: null,
      selectedProjectId: '',
      showProjectSettingsModal: false
    }

    this.showProjectSettingsModal = this.showProjectSettingsModal.bind(this);
  }

  componentDidMount(){
    this.props.loadProjectConfig(this.props.loggedInUser.id, this.props.authPermissions)
  }

  // To set Props values to State if props get modified
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(nextProps) {
    if(nextProps.parentProjectForNewProject !== undefined) {
      return {
        parentProjectForNewProject: nextProps.parentProjectForNewProject,
        selectedMode: nextProps.selectedMode,
        selectedProjectId: nextProps.selectedProjectId
      }
    } 
  }

  render () {
    return this.renderPlanProjectConfig()
  }

  renderPlanProjectConfig() {

    const {allProjects} = this.props
    const {selectedMode, selectedProjectId, parentProjectForNewProject, newProjectName} = this.state

    return (
      <div style={{position: 'relative', padding: '10px'}}>

        {/* <!-- First, a section that shows up with different actions we can perform on Projects --> */}
        {selectedMode === this.modes.HOME &&
          <div>
            <button className="btn btn-light btn-project-configuration" onClick={(e)=>this.setSelectedMode(this.modes.CREATE_PROJECT)}>
              <i className="far fa-2x fa-file"></i>
              <br/>Create new
            </button>

            <button className="btn btn-light btn-project-configuration" onClick={(e)=>this.setSelectedMode(this.modes.MANAGE_PROJECTS)}>
              <i className="fas fa-2x fa-tasks"></i>
              <br/>Manage
            </button>

            <button className="btn btn-light btn-project-configuration" onClick={(e)=>this.setSelectedMode(this.modes.COPY_PLAN_TO_PROJECT)}>
              <i className="fa fa-2x fa-angle-double-up"></i>
              <br/>Plan to Project
            </button>
          </div>
        }

        {/* <!-- Section for creating new projects --> */}
        {selectedMode === this.modes.CREATE_PROJECT &&
          <form>

            <div className="form-group row">
              <div className="col-sm-4 form-div-center">Name</div>
              <div className="col-sm-8">
                <input className="form-control" onChange={(e)=>this.handleProjectNameChange(e)} value={newProjectName}/>
              </div>
            </div>
        
            <div className="form-group row">
              <div className="col-sm-4 form-div-center">Parent</div>
              <div className="col-sm-8">
                <select className="form-control" style={{flex: '1 1 auto'}} onChange={(e)=>this.handleParentProjectChange(e)} value={parentProjectForNewProject.name}>
                  {allProjects.map((item, index) =>
                    <option key={index} value={item.name} label={item.name}></option>
                  )}
                </select>
              </div>
            </div>
        
            <div className="form-group row">
              <div className="col-sm-4 form-div-center"></div>
              <div className="col-sm-8">
                <div className="btn-group float-right">
                  <button className="btn btn-primary" onClick={(e)=>this.createProject(e, newProjectName, parentProjectForNewProject)}>Create</button>
                  <button className="btn btn-light" onClick={(e)=>this.cancelProjectCreation()}>Cancel</button>
                </div>
              </div>
            </div>

          </form>
        }

        {/* <!-- Section for managing / deleting projects --> */}
        {selectedMode === this.modes.MANAGE_PROJECTS &&
          <table id="tblProjectConfiguration" className="table table-striped table-sm">
            <thead className="thead-light">
              <tr>
                <th>Project name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {allProjects.map((project, index) =>
              <tr key={index}>
                <td>{project.name}</td>
                <td>
                  <div className="btn btn-group" style={{padding: '0px'}}>
                    <button className="btn btn-light btn-delete-project" disabled={!project.hasAdminPermission} onClick={(e)=>this.editProjectSettings(project)}>
                      <span className="fa fa-edit"></span>
                    </button>
        
                    <button className="btn btn-danger btn-delete-project" disabled={!project.hasAdminPermission} onClick={(e)=>this.deleteProject(project)}>
                      {!this.props.isDeleting &&
                        <i className="fas fa-trash-alt"></i>
                      }
                      {this.props.isDeleting &&
                        <i className="fa fa-spinner fa-spin"></i>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        }

        {/* <!-- Section for managing / deleting projects --> */}
        {selectedMode === this.modes.COPY_PLAN_TO_PROJECT &&
        <>
          <p>
            The currently open plan has a number of plan settings that are defined. You can copy these settings over
            to a project. Once this is done, plans created using the project will inherit these new settings.
          </p>
          <div className="alert alert-danger" role="alert">
            Warning: Once you perform this operation, ALL existing plans created from this project will be in an invalid state.
          </div>
          <form>
            <div className="form-group row">
              <div className="col-sm-4 form-div-center">Target project</div>
              <div className="col-sm-8">
                <select className="form-control" style={{flex: '1 1 auto'}} onChange={(e)=>this.handleTargetProjectChange(e)} value={selectedProjectId}>
                  {allProjects.map((item, index) =>
                    <option key={index} value={item.id} label={item.name}></option>
                  )}
                </select>
              </div>
            </div>
          </form>
          <button className="btn btn-block btn-danger" style={{marginBottom: '10px'}} onClick={(e)=>this.planSettingsToProject()}>
            Copy plan settings to selected project
          </button>
        </>
        }

        {/* <!-- Show a "back" button only if we are not in "Home" mode --> */}
        {selectedMode !== this.modes.HOME &&
          <button className="btn btn-light" onClick={(e)=>this.setSelectedMode(this.modes.HOME)}>
            <i className="fas fa-arrow-left"></i>
            &nbsp;&nbsp;Back
          </button>
        }

        <Modal isOpen={this.state.showProjectSettingsModal} size='lg' toggle={this.showProjectSettingsModal}>
          <ModalHeader toggle={this.showProjectSettingsModal}>Project Settings</ModalHeader>
          <ModalBody>
            <ProjectPermissions/>
          </ModalBody>
        </Modal>
      </div>
    )
  }

  editProjectSettings(src){
    this.showProjectSettingsModal()
    this.props.getAcl(src.id)
    this.props.setCurrentProjectTemplateId(src.id)
  }

  showProjectSettingsModal(){
    this.setState({showProjectSettingsModal: !this.state.showProjectSettingsModal});
  }

  handleTargetProjectChange(e){
    this.props.setSelectedProjectId(e.target.value)
  }

  planSettingsToProject(){
    this.props.planSettingsToProject(this.state.selectedProjectId, this.props.dataItems, this.props.resourceItems )
    this.props.setProjectMode(this.modes.HOME)
  }

  deleteProject (project) {

    this.askUserToConfirmManagerDelete(project.name)
    .then((okToDelete) => {
      if (okToDelete) {
        this.props.setIsDeleting(true)
        this.props.deleteProjectConfig(project, this.props.loggedInUser.id, this.props.authPermissions)
      }
    })
    .catch((err) => console.error(err))
  }

  askUserToConfirmManagerDelete (name) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete project template?',
        text: `Are you sure you want to delete "${name}"?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  createProject(e, newProjectName, parentProjectForNewProject){
    e.preventDefault();
    this.props.createNewProject(newProjectName, parentProjectForNewProject, this.props.loggedInUser.id, this.props.authPermissions)
    this.setState({newProjectName: 'New Project'});
  }

  handleProjectNameChange(e){
    this.setState({newProjectName: e.target.value});
  }

  handleParentProjectChange(e){

    let parentprojectname = e.target.value
    var pristinePrject = {}
    this.props.allProjects.map((project, index) => {
        if (project.name === parentprojectname){
          pristinePrject = project
        }
    })
    this.props.setParentProjectForNewProject(pristinePrject)
  }

  setSelectedMode(mode){
    this.props.setProjectMode(mode)
  }

  cancelProjectCreation(){
    this.setState({newProjectName: 'New Project'});
    this.props.setProjectMode(this.modes.HOME)
  }
}

  const mapStateToProps = (state) => ({
    loggedInUser: state.user.loggedInUser,
    authPermissions: state.user.authPermissions,
    dataItems: state.plan.dataItems,
    allProjects: state.plan.allProjects,
    selectedProjectId: state.plan.selectedProjectId,
    parentProjectForNewProject: state.plan.parentProjectForNewProject,
    isDeleting: state.plan.isDeleting,
    selectedMode: state.plan.selectedMode,
    resourceItems: state.plan.resourceItems
  })   

  const mapDispatchToProps = (dispatch) => ({
    loadProjectConfig: (userId, authPermissions) => dispatch(PlanActions.loadProjectConfig(userId, authPermissions)),
    createNewProject: (projectName, parentProject,userId, authPermissions) => dispatch(PlanActions.createNewProject(projectName, parentProject, userId, authPermissions)),
    deleteProjectConfig: (project, userId, authPermissions) => dispatch(PlanActions.deleteProjectConfig(project,userId, authPermissions)),
    setIsDeleting: (status) => dispatch(PlanActions.setIsDeleting(status)),
    setProjectMode: (mode) => dispatch(PlanActions.setProjectMode(mode)),
    planSettingsToProject: (selectedProjectId, dataItems, resourceItems) => dispatch(PlanActions.planSettingsToProject(selectedProjectId, dataItems, resourceItems)),
    getAcl: (resourceId, doForceUpdate = false) => dispatch(aclActions.getAcl("PROJECT_TEMPLATE", resourceId, doForceUpdate)),
    setCurrentProjectTemplateId: (selectedProjectTemplateId) => dispatch(ProjectTemplateActions.setCurrentProjectTemplateId(selectedProjectTemplateId)),
    setParentProjectForNewProject: (parentProjectForNewProject) => dispatch(PlanActions.setParentProjectForNewProject(parentProjectForNewProject)),
    setSelectedProjectId: (selectedProjectId) => dispatch(PlanActions.setSelectedProjectId(selectedProjectId))
   })

  const PlanProjectConfigComponent = wrapComponentWithProvider(reduxStore, PlanProjectConfig, mapStateToProps, mapDispatchToProps)
  export default PlanProjectConfigComponent
