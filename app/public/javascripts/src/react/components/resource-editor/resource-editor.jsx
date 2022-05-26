import React, { useEffect, useState } from 'react'
import { usePrevious } from '../../common/view-utils'
import { klona } from 'klona'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ResourceActions from './resource-actions'
import './resource-editor.css'
import ReactPaginate from 'react-paginate'
import PriceBookCreator from './pricebook-creator.jsx'
import PriceBookEditor from './pricebook-editor.jsx'
import RateReachManager from './rate-reach-creater.jsx'
import CompetitorEditor from './competitor-editor.jsx'
import PermissionsTable from '../acl/resource-permissions/permissions-table.jsx'
import FusionEditor from '../resource-manager/fusion-editor.jsx'
import NetworkArchitectureEditor from '../resource-manager/network-architecture-editor.jsx'
import PlanningConstraintsEditor from '../resource-manager/planning-constraints-editor.jsx'
import ArpuEditor from '../resource-editor/arpu-editor.jsx'
import RoicEditor from './roic/roic-editor.jsx'
import ImpedanceEditor from '../resource-editor/impedance-editor.jsx'
import TsmEditor from '../resource-editor/tsm-editor.jsx'
import RateReachEditor from '../resource-editor/rate-reach-editor.jsx'
import { Breadcrumbs } from '@mantine/core'

function ResourceEditor(props) {
  const sortableColumns = { 'NAME': 'name', 'RESOURCE_TYPE': 'resource_type' }
  const [_ssp, setSelectedPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [openRowId, setOpenRowId] = useState(null)
  const [cloneManager, setCloneManager] = useState('')
  const [cloneManagerType, setCloneManagerType] = useState('')
  const [openedManager, setOpenedManager] = useState('')
  const [selectedResourceName, setSelectedResourceName] = useState('')
  const [filterText, setFilterText] = useState('')
  const [isOrderDesc, setIsOrderDesc] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState('')

  const actionsECD = [
    {
      buttonText: 'Edit', // Edit
      buttonClass: 'btn-light',
      iconClass: 'fa-edit',
      toolTip: 'Edit',
      isEnabled: (row) => {
        return canEdit(row)
      },
      callBack: (row) => {
        editSelectedManager(row)
      }
    },
    {
      buttonText: 'Clone', // Clone
      buttonClass: 'btn-light',
      iconClass: 'fa-copy',
      toolTip: 'Clone',
      callBack: (row) => {
        cloneSelectedManagerFromSource(row)
      }
    },
    {
      buttonText: 'Delete', // Delete
      buttonClass: 'btn-outline-danger',
      iconClass: 'fa-trash-alt',
      toolTip: 'Delete',
      isEnabled: (row) => {
        return canAdmin(row)
      },
      callBack: (row) => {
        deleteSelectedResourceManager(row)
      }
    }
  ]

  useEffect(() => {
    props.getResourceTypes()
    props.getResourceManagers(filterText)
		props.canMakeNewFilter(filterText)
		props.setModalTitle('Resource Managers')
  }, [])

  useEffect(() => {
    if (filterText !== undefined && props.filterText !== undefined) {
      if (filterText === '') {
        setFilterText(props.filterText)
        setSelectedResourceName(props.selectedResourceName)
      }
    }
  }, [props.filterText])

  useEffect(() => {
    const editingManager = props.editingManager
    let selectedManager = editingManager && props.managers[editingManager.id]

    if (
      !props.isResourceEditor
      && selectedManager
      && props.selectedEditingMode === 'EDIT_RESOURCE_MANAGER'
    ) {
      if (!openedManager) {
        setOpenedManager(selectedManager.definition.managerType)
      }
      if (!props.breadCrumb.includes(selectedManager.resourceManagerName)) {
        addBreadCrumb(selectedManager.resourceManagerName)
      }
    } else if (
      props.isResourceEditor
      && props.selectedEditingMode === 'LIST_RESOURCE_MANAGERS'
    ) {
      if(props.breadCrumb.length >= 3) {
        removeBreadCrumb()
      }
      setOpenedManager('')
    }
  }, [props.editingManager, props.selectedEditingMode, props.isResourceEditor])

	const handleOnDiscard = () => {
		this.props.setIsResourceEditor(true)
	}

	const onSortClick = (colName) => {
    if (selectedColumn === colName) {
      setIsOrderDesc(!isOrderDesc)
    } else {
      setSelectedColumn(colName)
    }
  }

  const addBreadCrumb = (name) => {
    const breadCrumbClone = klona(props.breadCrumb)
    breadCrumbClone.push(name)
    props.setBreadCrumb(breadCrumbClone)
  }

  const removeBreadCrumb = () => {
    const breadCrumbClone = klona(props.breadCrumb)
    breadCrumbClone.pop()
    props.setBreadCrumb(breadCrumbClone)
  }

	const editSelectedManager = (selectedManager) => {
    props.startEditingResourceManager(
      selectedManager.id,
      selectedManager.resourceType,
      selectedManager.name,
      'EDIT_RESOURCE_MANAGER'
    )
    setCloneManager('')
    setCloneManagerType('')
	}

  const askNewResourceDetailsFromUser = () => {
		// Get the name for a new plan from the user
    return new Promise((resolve, reject) => {
      const swalOptions = {
        title: 'Resource name required',
        text: 'Enter the name of the new resource',
        type: 'input',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'OK'
      }
      swal(swalOptions, (resourceName) => {
        if (resourceName) {
          resolve(resourceName)
        } else {
					reject('Cancelled')
          setCloneManagerType('')
          setCloneManager('')
        }
      })
    })
	}
  
  const getNewResourceDetailsFromUser = (resourceType, id) => {
    askNewResourceDetailsFromUser()
      .then((resourceName) => {
        if (resourceName) {
          setCloneManagerType('')
          props.newManager(
            resourceType,
            resourceName,
            props.loggedInUser,
            id
          )
        }
      })
      .catch((err) => console.error(err))
  }
    
  const cloneSelectedManagerFromSource = (selectedManager) => {
    const { resourceType } = selectedManager
    if (resourceType === 'price_book' || resourceType === 'rate_reach_manager') {
      setCloneManagerType(resourceType)
      setCloneManager(selectedManager)
      props.setIsResourceEditor(false)
    } else {
      getNewResourceDetailsFromUser(resourceType, selectedManager.id)
    }
  }

	const askUserToConfirmManagerDelete = (managerName) => {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete resource manager?',
        text: `Are you sure you want to delete "${managerName}"?`,
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

	const deleteSelectedResourceManager = (selectedManager) => {
		askUserToConfirmManagerDelete(selectedManager.name)
      .then((okToDelete) => {
        if (okToDelete) {
          props.deleteResourceManager(selectedManager, selectedManager.resourceType)
        }
      })
      .catch((err) => console.error(err))
	}

  const handleCanMakeNewFilter = (cloneManagerType) => {
    const { setIsResourceEditor } = props;
		if (cloneManagerType !== 'competition_system') {
			setIsResourceEditor(false)
		}
    setCloneManagerType('')
    setCloneManagerType('')
    setOpenedManager('')
  }

  const toggleRow = (rowId) => {
		if (openRowId === rowId) {
			rowId = null
		}
    setOpenRowId(rowId)
  }

	const handlePageClick = (data) => {
		props.nextOrPrevPageClick(data.selected)
		setSelectedPage(data.selected)
	}

	const searchManagers = () => {
		const searchText = searchText
		props.searchManagers(searchText)
		props.getResourceManagers(filterText)
		setSearchText(searchText)
	}
  
	const handleChange = (event) => {
    const searchText = event.target.value
		event.target.name = searchText
    setSearchText(searchText)
	}

	const handleEnter = (event) => {
		if (event.key === 'Enter') {
			const searchText = searchText
			props.searchManagers(searchText)
			props.getResourceManagers(filterText)
			setSearchText(searchText)
		}
	}

	const handlefilterManager = (event) => {
		const filterText = event.target.value
		const selectedResourceIndex = event.nativeEvent.target.selectedIndex
		const selectedResourceName = event.nativeEvent.target[selectedResourceIndex].text

		props.getResourceManagers(filterText)
		props.canMakeNewFilter(filterText)
    setFilterText(filterText)
    setSelectedResourceName(selectedResourceName)
	}

  const renderResourceEditorTable = () => {
    let paginationElement
    if (props.pageableData.pageCount > 1) {
			paginationElement = (
				<ReactPaginate
					previousLabel={'«'}
					nextLabel={'»'}
					breakLabel={<span className="gap">...</span>}
					pageCount={props.pageableData.pageCount}
					onPageChange={(event) => handlePageClick(event)}
					forcePage={props.pageableData.currentPage}
					activeClassName={"active"}
					containerClassName={'pagination'}
					pageClassName={'page-item'}
					pageLinkClassName={'page-link'}
					previousLinkClassName={'page-link'}
					nextLinkClassName={'page-link'}
				/>
			)
		}

    return (
			<div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
					<div style={{flex: '0 0 auto'}}>
						<div className="form-group row">
								<label className="col-sm-4 col-form-label">Filter by Resource Type:</label>
								<div className="col-sm-8">
									<select
										className="form-control"
										onChange={(event) => handlefilterManager(event)}
										value={filterText}
									>
										<option key="all" value="all">all</option>
										{props.resourceTypes.map(item =>
											<option value={item.name} key={item.name}>{item.description}</option>
										)}
									</select>
								</div>
						</div>
						<div className="form-group row">
							<label className="col-sm-4 col-form-label">Search Name:</label>
							<div className="col-sm-8 input-group">
								<input type="text" className="form-control input-sm" onChange={(event) => handleChange(event)}
									onKeyDown={(event) => handleEnter(event)} name="searchText" value={searchText}/>               
								<button
									className="btn btn-light input-group-append"
									style={{cursor: 'pointer'}}
									onClick={(event) => searchManagers(event)}
								>
									<span style={{marginTop: '10px'}} className="fa fa-search"></span>
								</button>
							</div>
						</div>
					</div>
					<div className="comp_edit_tbl_contain" style={{flex: '1 1 auto', overflowY: 'auto'}}>
						<table className="table table-sm ei-table-foldout-striped" style={{borderBottom: "1px solid #dee2e6"}}>
							<thead className="thead-dark">
								<tr>
									<th></th>
									<th
										className='ei-table-col-head-sortable ng-binding ng-scope'
										onClick={event => { onSortClick(sortableColumns.NAME) }}
										style={{'cursor': 'pointer'}}
									>
										Name
										{selectedColumn === sortableColumns.NAME
											? <div className='ei-table-col-sort-icon ng-scope'>
													<i className={'fa' + (isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
												</div>
											: ''
										}
									</th>
									<th
										className='ei-table-col-head-sortable ng-binding ng-scope'
										onClick={event => { onSortClick(sortableColumns.RESOURCE_TYPE) }}
										style={{'cursor': 'pointer'}}
									>
										Resource Type
										{selectedColumn === sortableColumns.RESOURCE_TYPE
											? <div className='ei-table-col-sort-icon ng-scope'>
													<i className={'fa' + (isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
												</div>
											: ''
										}
									</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{renderDataRows()}
							</tbody>
						</table>
					</div>
					<div style={{flex: '0 0 auto'}}>
						<div className="float-right">
							{paginationElement}
						</div>
					</div>
					{
					props.isMakeNewFilter &&
						<div style={{flex: '0 0 auto'}}>
							<div className="form-group row justify-content-end">
								<div className="col-sm-6">
									<button
										onClick={() => handleCanMakeNewFilter(selectedResourceName)}
										value={selectedResourceName}
										className="btn btn-light btn-block"
									>
										<i className="fa fa-file action-button-icon"></i>
										New {selectedResourceName}
									</button>
								</div>
							</div>
						</div>
					}
					<>
						{
							cloneManagerType === 'competition_system'
                && getNewResourceDetailsFromUser(
                      cloneManagerType,
                      cloneManager.i
                    )
						}
					</>
			</div>
		)
	}

	const renderDataRows = () => {
    const jsx = []
    const clonePaginatedData = klona(props.pageableData.paginateData.slice(0))
    clonePaginatedData.sort((a, b) => {
      let aVal = ''
      let bVal = ''
      if (selectedColumn === sortableColumns.NAME) {
        aVal = a['name']
				bVal = b['name']
      } else if (selectedColumn === sortableColumns.RESOURCE_TYPE) {
        aVal = a['resourceType']
				bVal = b['resourceType']
      }
      if (isOrderDesc) {
        const holder = aVal
        aVal = bVal
        bVal = holder
      }
      return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1
    })
    clonePaginatedData.forEach((recourceItem, recourceKey) => {
      jsx.push(renderDataRow(recourceItem, recourceKey))
    })
    return jsx
	}

	const renderDataRow = (listValue, rowKey) => {
		const resourceFormattedObject = {
      identifier: listValue.id,
      dataType: listValue.resourceType,
			name: listValue.name,
      permissions: 63,
      id: listValue.id
		}
		return (
			<React.Fragment key={listValue.id}>
				<tr className={openRowId === rowKey ? 'ei-foldout-table-open' : ''} key={listValue.id+'_a'}>
					<td onClick={event => { toggleRow(rowKey) }}>
						<i className='far fa-minus-square ei-foldout-icon ei-foldout-icon-table-open' />
						<i className='far fa-plus-square ei-foldout-icon ei-foldout-icon-table-closed' />
					</td>
					<td>{listValue.name}</td>
					<td>{listValue.resourceType}</td>
					<td className="ei-table-cell ei-table-button-cell">
						<button
							className="btn btn-sm ng-class: btnValue.buttonClass;"
							data-toggle="tooltip"
							data-placement="bottom"
							title="{{btnValue.toolTip}}"
						>
							<i className="fa ei-button-icon"></i>
						</button>
						<div className="btn-group">
							<button
								type="button"
								className="btn btn-sm"
								data-toggle="dropdown"
								aria-haspopup="true"
								aria-expanded="false"
							>
							<i className="fa fa-bars ei-button-icon"></i>
							</button>
							<div className="dropdown-menu dropdown-menu-right">
								{
									actionsECD.map(( listButton, buttonKey ) => {
										return (
											<React.Fragment key={buttonKey}>
												<button
													className="dropdown-item"
													type="button"
													onClick={() => listButton.callBack(listValue, rowKey)}
												>
													{listButton.buttonText}
												</button>
											</React.Fragment>
										)
									})
								}
							</div>
						</div>
					</td>
				</tr>
				<tr className='ei-foldout-row' key={listValue.id+'_b'}>
					<td colSpan='999'>
						<div style={{ 'padding': '0px 20px 0px 20px' }}>
							{
								openRowId === rowKey
								? <PermissionsTable resource={resourceFormattedObject} resourceType='RESOURCE_MANAGER' isOwner={true} />
								: ''
							}
						</div>
					</td>
				</tr>
			</React.Fragment>
		)
	}

  const renderResourceManager = () => {
    return (
			<>
				{
					cloneManagerType === 'price_book' && openedManager !== 'price_book' &&
					<PriceBookCreator cloneManager={cloneManager}/>
				}
				{
					openedManager === 'price_book' &&
					<PriceBookEditor/>
				}
				{
					openedManager === 'tsm_manager' &&
					<TsmEditor/>
				}
				{
					openedManager === 'roic_manager' &&
					<RoicEditor/>
				}
				{
					openedManager === 'arpu_manager' &&
					<ArpuEditor/>
				}
				{
					openedManager === 'impedance_mapping_manager' &&
					<ImpedanceEditor/>
				}
				{
					cloneManagerType === 'rate_reach_manager' && openedManager !== 'rate_reach_manager' &&
					<RateReachManager cloneManager={cloneManager}/>
				}
				{
					openedManager === 'rate_reach_manager' &&
					<RateReachEditor/>
				}
				{
					openedManager === 'competition_manager' &&
					<CompetitorEditor/>
				}
				{
					openedManager === 'fusion_manager' &&
					<FusionEditor onDiscard={handleOnDiscard}/>
				}
				{
					openedManager === 'network_architecture_manager' &&
					<NetworkArchitectureEditor onDiscard={handleOnDiscard}/>
				}
				{
					openedManager === 'planning_constraints_manager' &&
					<PlanningConstraintsEditor onDiscard={handleOnDiscard}/>
				}
			</>
    )
	}

  return (
    <>
      {
        props.resourceTypes && 
          props.isResourceEditor
            ? renderResourceEditorTable()
            : renderResourceManager()
      }
    </>  
  )
}

const mapStateToProps = (state) => ({
	resourceTypes: state.resourceEditor.resourceTypes,
	resourceManagers: state.resourceEditor.resourceManagers,
	pageableData: state.resourceEditor.pageableData,
	isMakeNewFilter: state.resourceEditor.isMakeNewFilter,
	isResourceEditor: state.resourceEditor.isResourceEditor,
	loggedInUser: state.user.loggedInUser,
  modalTitle: state.resourceEditor.modalTitle,
  editingManager: state.resourceManager.editingManager,
  managers: state.resourceManager.managers,
  selectedEditingMode: state.resourceManager.selectedEditingMode,
})

const mapDispatchToProps = (dispatch) => ({
	getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
	getResourceManagers: (filterText) => dispatch(ResourceActions.getResourceManagers(filterText)),
	nextOrPrevPageClick: (selectedPage) => dispatch(ResourceActions.nextOrPrevPageClick(selectedPage)),
	searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
	canMakeNewFilter: (filterText) => dispatch(ResourceActions.canMakeNewFilter(filterText)),
	setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
	deleteResourceManager: (selectedManager, filterText) => dispatch(
		ResourceActions.deleteResourceManager(selectedManager, filterText)
	),
	startEditingResourceManager: (id, type, name, editingMode) => dispatch(
		ResourceActions.startEditingResourceManager(id, type, name, editingMode)
	),
	newManager: (resourceType, resourceName, loggedInUser, sourceId) => dispatch(
		ResourceActions.newManager(resourceType, resourceName, loggedInUser, sourceId)
	),
	setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
})

const ResourceEditorComponent = wrapComponentWithProvider(reduxStore, ResourceEditor, mapStateToProps, mapDispatchToProps)
export default ResourceEditorComponent
