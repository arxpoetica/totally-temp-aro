import React, { useState, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import ToolBarSearch from '../../header/tool-bar-search.jsx'
import EditPlanTag from '../../header/edit-plan-tag.jsx'
import ToolBarActions from '../../header/tool-bar-actions.js'
import PermissionsTable from '../../acl/resource-permissions/permissions-table.jsx'
import PlanActions from '../../plan/plan-actions'
import AroHttp from '../../../common/aro-http'

export const PlanInfo = (props) => {

  const [state, setState] = useState({
    isEditMode: false,
    currentUserCanEdit: false,
    addGeneralTags: false,
    addSATags: false,
    generalPlanTags: [],
    saPlanTags: [],
  })

  // Save the permission bits for resource read, write and admin
  const accessTypes = Object.freeze({
    RESOURCE_READ: { displayName: 'Read', permissionBits: null, actors: [] },
    RESOURCE_WRITE: { displayName: 'Write', permissionBits: null, actors: [] },
    RESOURCE_ADMIN: { displayName: 'Owner', permissionBits: null, actors: [] }
  })

  const { isEditMode, currentUserCanEdit, addGeneralTags, addSATags, generalPlanTags, saPlanTags } = state
  const { plan, systemActors, listOfServiceAreaTags, currentPlanServiceAreaTags, listOfTags, currentPlanTags,
    dataItems, getTagColour, loggedInUser, authRoles, editActivePlan, loadPlan, setCurrentPlanTags,
    setCurrentPlanServiceAreaTags, deletePlan } = props

  useEffect(() => {
    updateEditableStatus()
    getPlanTagDetails()
  }, [])

  useEffect(() => {
    getPlanTagDetails()
  }, [plan])


  const editCurrentPlan = () => {
    setState((state) => ({ ...state, isEditMode: true }))
    const saPlanTags = getSATagCategories(plan.tagMapping.linkTags.serviceAreaIds)
    setCurrentPlanServiceAreaTags(saPlanTags)
    const generalPlanTags = getTagCategories(plan.tagMapping.global)
    setCurrentPlanTags(generalPlanTags)
  }

  const getPlanCreatorName = (createdBy) => {
    const creator = systemActors[createdBy]
    return creator && ((creator.type === 'group') ? creator.name : `${creator.firstName} ${creator.lastName}`)
  }

  const handleAddGeneralTags = () => {
    setState((state) => ({ ...state, addGeneralTags: true }))
  }

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

  const getTagCategories = (currentPlanTags) => {
    return listOfTags.filter(tag => _.contains(currentPlanTags, tag.id))
  }

  const getSATagCategories = (currentPlanTags) => {
    return listOfServiceAreaTags.filter(tag => _.contains(currentPlanTags, tag.id))
  }

  const planResource = { identifier: plan.id, dataType: "", name: plan.name, permissions: 63, id: plan.id }

  const removeTagFn = (type, tag) => {
    updateTag(plan, {type: type, tag: tag})
      .then(() => {
        loadPlan(plan.id)
      })
  }

  const updateTag = (plan, removeTag) => {
    const updatePlan = plan
    if (removeTag.type === 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = _.without(
        updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.tag.id
      )
      const saPlanTags = getSATagCategories(updatePlan.tagMapping.linkTags.serviceAreaIds)
      setCurrentPlanServiceAreaTags(saPlanTags)
    } else {
      updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removeTag.tag.id)
      const generalPlanTags = getTagCategories(updatePlan.tagMapping.global)
      setCurrentPlanTags(generalPlanTags)
    }

    return AroHttp.put(`/service/v1/plan`, updatePlan)
  }

  const updateEditableStatus = async () => {
    setState((state) => ({ ...state, currentUserCanEdit: false }))
    AroHttp.get('/service/auth/permissions')
      .then((result) => {
        result.data.forEach((authPermissionEntity) => {
          if (accessTypes.hasOwnProperty(authPermissionEntity.name)) {
            accessTypes[authPermissionEntity.name].permissionBits = authPermissionEntity.id
          }
        })
        // Get the actors that have access for this resource
        return Promise.all([
          AroHttp.get(`/service/auth/acl/PLAN/${plan.id}`),
          AroHttp.get(`/service/auth/acl/SYSTEM/${loggedInUser.id}`)
        ])
      })
      .then((results) => {
        const planPermissions = results[0].data; const systemPermissions = results[1].data
        // First, check if the user or usergroups have write permissions
        var currentUserCanWrite = false; var currentUserIsAdmin = false; var isUserCanEdit = false
        planPermissions.resourcePermissions.forEach((access) => {
          // We are checking if the logged in user or any of the users groups have permission to write.
          if ((loggedInUser.id === access.systemActorId) ||
              (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            const permission = access.rolePermissions
            currentUserCanWrite = ((permission & accessTypes.RESOURCE_WRITE.permissionBits) != 0)
            currentUserIsAdmin = ((permission & accessTypes.RESOURCE_ADMIN.permissionBits) != 0)
            isUserCanEdit = currentUserCanEdit || currentUserCanWrite || currentUserIsAdmin
          }
        })

        // Next, check the global namespace to see if this user or groups have "SuperUser" permissions
        systemPermissions.resourcePermissions.forEach((access) => {
          // We are checking if the logged in user or any of the users groups have permission to write.
          if ((loggedInUser.id === access.systemActorId) ||
              (loggedInUser.groupIds.indexOf(access.systemActorId) >= 0)) {
            const currentUserIsGod = (access.rolePermissions === authRoles.SUPER_USER.permissions)
            isUserCanEdit = isUserCanEdit || currentUserIsGod
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
    const generalPlanTags = getTagCategories(plan.tagMapping.global)
    setState((state) => ({ ...state, generalPlanTags }))
    const saPlanTags = getSATagCategories(plan.tagMapping.linkTags.serviceAreaIds)
    setState((state) => ({ ...state, saPlanTags }))
  }

  const updatePlanTags = () => {
    plan.tagMapping.global = _.map(currentPlanTags, (tag) => tag.id)
    plan.tagMapping.linkTags.serviceAreaIds = _.map(currentPlanServiceAreaTags, (tag) => tag.id)
    AroHttp.put(`/service/v1/plan`, plan)
  }

  return (
    !plan.ephemeral ?
      <div className="aro-plan-details-container">
        <div style={{ position: 'relative' }}>
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
                    <ToolBarSearch currentView='viewModePlanInfo'/>
                  }
                </td>
              </tr>
              {plan.createdBy &&
                <tr ng-if="$ctrl.state.plan.createdBy">
                  <td>Created By</td>
                  <td>{ getPlanCreatorName(plan.createdBy) }</td>
                </tr>
              }
              <tr>
                <td>General tags</td>
                <td>
                  <span className="tags">
                    {!addGeneralTags &&
                      generalPlanTags.map((tag, index) => {
                        return (
                          <div className="badge badge-primary" key={index}
                            style={{ backgroundColor: getTagColour(tag) }}>
                            <span>
                              {tag.name} &nbsp;
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
                  } &nbsp;
                  <span>
                    {(isEditMode && !addGeneralTags) &&
                      <i className="fa fa-plus pointer" onClick={() => handleAddGeneralTags()}></i>
                    }
                  </span>
                </td>
              </tr>
              <tr>
                <td>Service area tags</td>
                <td>
                  <span className="tags">
                    {!addSATags &&
                      saPlanTags.map((tag, index) => {
                        return (
                          <div className="badge satags" key={index}>
                            <span> {tag.code} &nbsp;
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
                    } &nbsp;
                    <span>
                      {(isEditMode && !addSATags) &&
                        <i className="fa fa-plus pointer" onClick={() => handleAddSATags()}></i>
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
          <div className="disable-sibling-controls" style={{display : isEditMode ? 'none' : 'block' }} />
        </div>

        <div className="aro-plan-actions">
          {!isEditMode &&
            <button
              className="btn btn-primary"
              disabled={!currentUserCanEdit}
              onClick={() => editCurrentPlan()}
            >
              <i className="fa fa-pencil"></i>&nbsp;&nbsp;Edit Plan Details
            </button>
          }
          {isEditMode &&
            <button
              className="btn btn-primary"
              disabled={!currentUserCanEdit}
              onClick={() => commitUpdatestoPlan(false)}
            >
              <i className="fa fa-save"></i>&nbsp;&nbsp;Save Changes
            </button>
          }
          <button
            className="btn btn-danger"
            disabled={!currentUserCanEdit}
            onClick={() => deletePlan(plan)}
          >
            <i className="far fa-trash-alt"></i>&nbsp;&nbsp;Delete Plan
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

export default wrapComponentWithProvider(reduxStore, PlanInfo, mapStateToProps, mapDispatchToProps)
