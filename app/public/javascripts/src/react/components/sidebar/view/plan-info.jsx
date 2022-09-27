import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import LocationSearch from '../../header/location-search.jsx'
import EditPlanTag from '../../header/edit-plan-tag.jsx'
import ToolBarActions from '../../header/tool-bar-actions.js'
import PermissionsTable from '../../acl/resource-permissions/permissions-table.jsx'
import PlanActions from '../../plan/plan-actions'
import AroHttp from '../../../common/aro-http'
import { getPlanCreatorName, getTagCategories, getSATagCategories } from './plan-info-common.js'

export const PlanInfo = (props) => {

  const [state, setState] = useState({
    isEditMode: false,
    currentUserCanEdit: false,
    addGeneralTags: false,
    addSATags: false,
    generalPlanTags: [],
    saPlanTags: [],
  })

  const { isEditMode, currentUserCanEdit, addGeneralTags, addSATags, generalPlanTags, saPlanTags } = state
  const { plan, systemActors, listOfServiceAreaTags, currentPlanServiceAreaTags, listOfTags, currentPlanTags,
    dataItems, getTagColour, loggedInUser, authRoles, authPermissions, editActivePlan, loadPlan, setCurrentPlanTags,
    setCurrentPlanServiceAreaTags, deletePlan, loadListOfSAPlanTags } = props

  useEffect(() => {
    updateEditableStatus()
    getPlanTagDetails()
    loadPlan(plan.id)
  }, [])

  useEffect(() => {
    getPlanTagDetails()
  }, [plan])


  const editCurrentPlan = () => {
    setState((state) => ({ ...state, isEditMode: true }))
    const saPlanTags = getSATagCategories(plan.tagMapping.linkTags.serviceAreaIds, listOfServiceAreaTags)
    setCurrentPlanServiceAreaTags(saPlanTags)
    const generalPlanTags = getTagCategories(plan.tagMapping.global, listOfTags)
    setCurrentPlanTags(generalPlanTags)
  }

  const handleAddGeneralTags = () => setState((state) => ({ ...state, addGeneralTags: true }))

  const onRefreshTagList = () => {
    loadListOfSAPlanTags(dataItems)
  }

  const handleAddSATags = () => {
    setState((state) => ({ ...state, addSATags: true }))
  }

  const commitUpdatestoPlan = (isDestroyingControl) => {
    // This will call a function into the resource permissions editor that will do the actual save
    // DO NOT SAVE ON DESTROY. This may be causing all sorts of issues with threading on service.
    if (!isDestroyingControl) {
      updatePlanTags()
      getPlanTagDetails()
    }
    setState((state) => ({ ...state, isEditMode: false, addGeneralTags: false, addSATags: false }))
  }

  const planResource = { identifier: plan.id, dataType: '', name: plan.name, permissions: 63, id: plan.id }

  const removeTagFn = async(type, tag) => {
    await updateTag(plan, { type, tag })
    loadPlan(plan.id)
  }

  const updateTag = (plan, removeTag) => {
    const updatePlan = plan
    if (removeTag.type === 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = updatePlan.tagMapping.linkTags.serviceAreaIds
        .filter(item => removeTag.tag.id !== item)
      const saPlanTags = getSATagCategories(updatePlan.tagMapping.linkTags.serviceAreaIds, listOfServiceAreaTags)
      setCurrentPlanServiceAreaTags(saPlanTags)
    } else {
      updatePlan.tagMapping.global = updatePlan.tagMapping.global.filter(item => removeTag.tag.id !== item)
      const generalPlanTags = getTagCategories(updatePlan.tagMapping.global, listOfTags)
      setCurrentPlanTags(generalPlanTags)
    }

    return AroHttp.put('/service/v1/plan', updatePlan)
  }

  const updateEditableStatus = () => {
    setState((state) => ({ ...state, currentUserCanEdit: false }))
    Promise.all([
        AroHttp.get(`/service/auth/acl/PLAN/${plan.id}`),
        AroHttp.get(`/service/auth/acl/SYSTEM/${loggedInUser.id}`)
      ])
      .then((results) => {
        const planPermissions = results[0].data
        const systemPermissions = results[1].data
        console.log({planPermissions, systemPermissions})
        // First, check if the user or usergroups have write permissions
        let currentUserCanWrite = false
        let currentUserIsAdmin = false
        let isUserCanEdit = false
        planPermissions.resourcePermissions.forEach((access) => {
          // We are checking if the logged in user or any of the users groups have permission to write.
          if ((loggedInUser.id === access.systemActorId) ||
              (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            const permission = access.rolePermissions
            currentUserCanWrite = ((permission & authPermissions.RESOURCE_WRITE.permissionBits) !== 0)
            currentUserIsAdmin = ((permission & authPermissions.RESOURCE_ADMIN.permissionBits) !== 0)
            isUserCanEdit = isUserCanEdit || currentUserCanEdit || currentUserCanWrite || currentUserIsAdmin
          }
        })

        // Next, check the global namespace to see if this user or groups have "SuperUser" permissions
        const allButResourceWorkflow = authRoles.SUPER_USER.permissions - authPermissions.RESOURCE_WORKFLOW.permissionBits
        systemPermissions.resourcePermissions.forEach((access) => {
          // We are checking if the logged in user or any of the users groups have permission to write.
          if ((loggedInUser.id === access.systemActorId) ||
              (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            const currentUserIsGod = (access.rolePermissions === authRoles.SUPER_USER.permissions)
            const currentUserIsAllButResourceWorkflow = (access.rolePermissions === allButResourceWorkflow)
            isUserCanEdit = isUserCanEdit || currentUserIsGod || currentUserIsAllButResourceWorkflow
          }
        })

        setState((state) => ({ ...state, currentUserCanEdit: isUserCanEdit }))

      })
      .catch((err) => console.error(err))
  }

  const handlePlanNameChange = (event) => {
    plan.name = event.target.value
    editActivePlan(JSON.parse(JSON.stringify(plan)))
  }

  const getPlanTagDetails = () => {
    const generalPlanTags = getTagCategories(plan.tagMapping.global, listOfTags)
    setState((state) => ({ ...state, generalPlanTags }))
    const saPlanTags = getSATagCategories(plan.tagMapping.linkTags.serviceAreaIds, listOfServiceAreaTags)
    setState((state) => ({ ...state, saPlanTags }))
  }

  const updatePlanTags = () => {
    plan.tagMapping.global = currentPlanTags.map(tag => tag.id)
    plan.tagMapping.linkTags.serviceAreaIds = currentPlanServiceAreaTags.map(tag => tag.id)
    AroHttp.put('/service/v1/plan', plan)
  }

  return (
    !plan.ephemeral ?
      <div className="aro-plan details-container">
        <div className="details-container">
          <table id="tblPlanInfo" className="table table-sm table-striped">
            <tbody>
              <tr>
                <td>Plan Name</td>
                <td>
                  {!isEditMode &&
                    <span>{plan.name}</span>
                  }
                  {isEditMode &&
                    <input
                      type="text"
                      className="form-control text-left"
                      placeholder="Plan Name"
                      value={plan.name}
                      onChange={(event) => handlePlanNameChange(event)}
                    />
                  }
                </td>
              </tr>
              <tr>
                <td>Plan Location</td>
                <td>
                  {!isEditMode &&
                    <span>{plan.areaName}</span>
                  }
                  {isEditMode &&
                    <LocationSearch currentView='viewModePlanInfo'/>
                  }
                </td>
              </tr>
              {plan.createdBy &&
                <tr>
                  <td>Created By</td>
                  <td>{ getPlanCreatorName(plan.createdBy, systemActors) }</td>
                </tr>
              }
              <tr>
                <td>General tags</td>
                <td className={`${isEditMode && addGeneralTags ? 'tags-height' : ''}`}>
                  <span className="tags">
                    {!addGeneralTags &&
                      generalPlanTags.map((tag, index) => {
                        return (
                          <div className="badge badge-primary" key={index}
                            style={{ backgroundColor: getTagColour(tag) }}>
                            <span>
                              {tag.name}
                              <span className="blank-space" />
                              {isEditMode &&
                                <i
                                  className="fa fa-times pointer"
                                  onClick={() => removeTagFn('general', tag)}
                                />
                              }
                            </span>
                          </div>
                        )
                      })
                    }
                  </span>
                  {addGeneralTags &&
                    <EditPlanTag
                      objectName="Tag"
                      searchList={listOfTags}
                      selectedList={generalPlanTags}
                    />
                  }
                  <span className="blank-space" />
                  <span>
                    {(isEditMode && !addGeneralTags) &&
                      <i className="fa fa-plus pointer" onClick={() => handleAddGeneralTags()} />
                    }
                  </span>
                </td>
              </tr>
              <tr>
                <td>Service area tags</td>
                <td className={`${isEditMode && addSATags ? 'tags-height' : ''}`}>
                  <span className="tags">
                    {!addSATags &&
                      saPlanTags.map((tag, index) => {
                        return (
                          <div className="badge satags" key={index}>
                            <span>
                              {tag.code}
                              <span className="blank-space" />
                              {isEditMode &&
                                <i
                                  className="fa fa-times pointer"
                                  onClick={() => removeTagFn('svc', tag)}
                                />
                              }
                            </span>
                          </div>
                        )
                      })
                    }
                  </span>
                  {addSATags &&
                    <EditPlanTag
                      objectName="Service Area"
                      searchList={listOfServiceAreaTags}
                      selectedList={saPlanTags}
                      refreshTagList={onRefreshTagList}
                    />
                  }
                  <span className="blank-space" />
                  <span>
                    {(isEditMode && !addSATags) &&
                      <i className="fa fa-plus pointer" onClick={() => handleAddSATags()} />
                    }
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <PermissionsTable resource={planResource} resourceType='PLAN' isOwner={isEditMode} />
                </td>
              </tr>
            </tbody>
          </table>
          {/* Add a div that will overlay all the controls above. The div will be visible when the controls need to be disabled. */}
          <div className="disable-sibling-controls" style={{ display: isEditMode ? 'none' : 'block' }} />
        </div>

        <div className="actions">
          {!isEditMode &&
            <button
              className="btn btn-primary"
              disabled={!currentUserCanEdit}
              onClick={() => editCurrentPlan()}
            >
              <i className="fas fa-pencil-alt" />
              <span className="blank-space">Edit Plan Details</span>
            </button>
          }
          {isEditMode &&
            <button
              type="button"
              className="btn btn-primary"
              disabled={!currentUserCanEdit}
              onClick={() => commitUpdatestoPlan(false)}
            >
              <i className="fa fa-save" />
              <span className="blank-space">Save Changes</span>
            </button>
          }
          <button
            className="btn btn-danger"
            disabled={!currentUserCanEdit}
            onClick={() => deletePlan(plan)}
          >
            <i className="far fa-trash-alt" />
            <span className="blank-space">Delete Plan</span>
          </button>
        </div>
      </div>
    : <></>
  )
}

const mapStateToProps = (state) => ({
  plan: state.plan.activePlan,
  systemActors: state.user.systemActors,
  listOfTags: state.toolbar.listOfTags,
  currentPlanTags: state.toolbar.currentPlanTags,
  listOfServiceAreaTags: state.toolbar.listOfServiceAreaTags,
  currentPlanServiceAreaTags: state.toolbar.currentPlanServiceAreaTags,
  dataItems: state.plan.dataItems,
  loggedInUser: state.user.loggedInUser,
  authRoles: state.user.authRoles,
  authPermissions: state.user.authPermissions,
})

const mapDispatchToProps = (dispatch) => ({
  loadListOfSAPlanTags: (dataItems, filterObj, isHardReload) => dispatch(
    ToolBarActions.loadListOfSAPlanTags(dataItems, filterObj, isHardReload)
  ),
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag)),
  editActivePlan: (plan) => dispatch(PlanActions.editActivePlan(plan)),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
  setCurrentPlanTags: (currentPlanTags) => dispatch(ToolBarActions.setCurrentPlanTags(currentPlanTags)),
  setCurrentPlanServiceAreaTags: (currentPlanServiceAreaTags) => dispatch(
    ToolBarActions.setCurrentPlanServiceAreaTags(currentPlanServiceAreaTags)
  ),
  deletePlan: (plan) => dispatch(PlanActions.deletePlan(plan)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanInfo)
