import React, { Component } from 'react'
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

export class ResourceEditor extends Component {
  constructor (props) {
		super(props)

		this.handleOnDiscard = this.handleOnDiscard.bind(this)

		this.sortableColumns = { 'NAME': 'name', 'RESOURCE_TYPE': 'resource_type' }
    this.sortedRows = []
    this.state = {
			selectedPage: 0,
			searchText: '',
			filterText: '',
			openRowId: null,
			selectedResourceName: '',
			selectedResourceForClone: '',
			clickedResource: '',
			clickedResourceForEditAndClone: '',
		}

		this.actionsECD = [
      {
        buttonText: 'Edit', // Edit
        buttonClass: 'btn-light',
        iconClass: 'fa-edit',
        toolTip: 'Edit',
        isEnabled: (row) => {
          return this.canEdit(row)
        },
        callBack: (row) => {
          this.editSelectedManager(row)
        }
      },
      {
        buttonText: 'Clone', // Clone
        buttonClass: 'btn-light',
        iconClass: 'fa-copy',
        toolTip: 'Clone',
        callBack: (row) => {
          this.cloneSelectedManagerFromSource(row)
        }
      },
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        isEnabled: (row) => {
          return this.canAdmin(row)
        },
        callBack: (row) => {
          this.deleteSelectedResourceManager(row)
        }
      }
		]
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		if (prevState.filterText !== undefined && nextProps.filterText !== undefined) {
			if (prevState.filterText === '') {
				return {
					filterText: nextProps.filterText,
					selectedResourceName: nextProps.selectedResourceName,
				}
			} else {
				return {
					filterText: prevState.filterText,
					selectedResourceName: prevState.selectedResourceName,
				}
			}
		}
  }

  componentDidMount () {
    this.props.getResourceTypes()
    this.props.getResourceManagers(this.state.filterText)
		this.props.canMakeNewFilter(this.state.filterText)
		this.props.setModalTitle('Resource Managers')
	}

  componentDidUpdate(prevProp) {
    if (
      !prevProp.isResourceEditor
      && this.props.isResourceEditor
      && this.props.breadCrumb[this.props.breadCrumb.length - 1] === 'ROIC Settings'
    ) {
      const breadCrumbClone = klona(this.props.breadCrumb)
      breadCrumbClone.pop()
      this.props.setBreadCrumb(breadCrumbClone)
    }
  }

  render () {
    return !this.props.resourceTypes
    ? null
    : <>
				{
          this.props.isResourceEditor
          ? this.renderResourceEditorTable()
          : this.renderResourceManager()
        }
      </>
  }

  renderResourceEditorTable() {

    let paginationElement
    if (this.props.pageableData.pageCount > 1) {
			paginationElement = (
				<ReactPaginate
					previousLabel={'«'}
					nextLabel={'»'}
					breakLabel={<span className="gap">...</span>}
					pageCount={this.props.pageableData.pageCount}
					onPageChange={(event) => this.handlePageClick(event)}
					forcePage={this.props.pageableData.currentPage}
					activeClassName={"active"}
					containerClassName={'pagination'}
					pageClassName={'page-item'}
					pageLinkClassName={'page-link'}
					previousLinkClassName={'page-link'}
					nextLinkClassName={'page-link'}
				/>
			)
		}

		this.sortedRows = this.props.pageableData.paginateData.slice(0)
    this.sortedRows.sort((a, b) => {
      let aVal = ''
      let bVal = ''
      if (this.state.selectedColumn === this.sortableColumns.NAME) {
        aVal = a['name']
				bVal = b['name']
      } else if (this.state.selectedColumn === this.sortableColumns.RESOURCE_TYPE) {
        aVal = a['resourceType']
				bVal = b['resourceType']
      }
      if (this.state.isOrderDesc) {
        const holder = aVal
        aVal = bVal
        bVal = holder
      }
      return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1
    })

    return (
			<div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
					<div style={{flex: '0 0 auto'}}>
						<div className="form-group row">
								<label className="col-sm-4 col-form-label">Filter by Resource Type:</label>
								<div className="col-sm-8">
									<select
										className="form-control"
										onChange={(event) => this.handlefilterManager(event)}
										value={this.state.filterText}
									>
										<option key="all" value="all">all</option>
										{this.props.resourceTypes.map(item =>
											<option value={item.name} key={item.name}>{item.description}</option>
										)}
									</select>
								</div>
						</div>
						<div className="form-group row">
							<label className="col-sm-4 col-form-label">Search Name:</label>
							<div className="col-sm-8 input-group">
								<input type="text" className="form-control input-sm" onChange={(event) => this.handleChange(event)}
									onKeyDown={(event) => this.handleEnter(event)} name="searchText" value={this.state.searchText}/>               
								<button
									className="btn btn-light input-group-append"
									style={{cursor: 'pointer'}}
									onClick={(event) => this.searchManagers(event)}
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
										onClick={event => { this.onSortClick(this.sortableColumns.NAME) }}
										style={{'cursor': 'pointer'}}
									>
										Name
										{this.state.selectedColumn === this.sortableColumns.NAME
											? <div className='ei-table-col-sort-icon ng-scope'>
													<i className={'fa' + (this.state.isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
												</div>
											: ''
										}
									</th>
									<th
										className='ei-table-col-head-sortable ng-binding ng-scope'
										onClick={event => { this.onSortClick(this.sortableColumns.RESOURCE_TYPE) }}
										style={{'cursor': 'pointer'}}
									>
										Resource Type
										{this.state.selectedColumn === this.sortableColumns.RESOURCE_TYPE
											? <div className='ei-table-col-sort-icon ng-scope'>
													<i className={'fa' + (this.state.isOrderDesc ? ' fa-chevron-up' : ' fa-chevron-down')} aria-hidden='true'> </i>
												</div>
											: ''
										}
									</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{this.renderDataRows()}
							</tbody>
						</table>
					</div>
					<div style={{flex: '0 0 auto'}}>
						<div className="float-right">
							{paginationElement}
						</div>
					</div>
					{
					this.props.isMakeNewFilter &&
						<div style={{flex: '0 0 auto'}}>
							<div className="form-group row justify-content-end">
								<div className="col-sm-6">
									<button
										onClick={() => this.handleCanMakeNewFilter(this.state.selectedResourceName)}
										value={this.state.selectedResourceName}
										className="btn btn-light btn-block"
									>
										<i className="fa fa-file action-button-icon"></i>
										New {this.state.selectedResourceName}
									</button>
								</div>
							</div>
						</div>
					}
					<>
						{
							this.state.clickedResource === 'Competition System' &&
							this.getNewResourceDetailsFromUser()
						}
					</>
			</div>
		)
	}

	renderDataRows () {
    const jsx = []
    this.sortedRows.forEach((recourceItem, recourceKey) => {
      jsx.push(this.renderDataRow(recourceItem, recourceKey ))
    })
    return jsx
	}

	renderDataRow (listValue, rowKey) {
		const resourceFormattedObject = { identifier: listValue.id, dataType: listValue.resourceType,
			name: listValue.name, permissions: 63, id: listValue.id
		}
		return (
			<React.Fragment key={listValue.id}>
				<tr className={this.state.openRowId === rowKey ? 'ei-foldout-table-open' : ''} key={listValue.id+'_a'}>
					<td onClick={event => { this.toggleRow(rowKey) }}>
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
									this.actionsECD.map(( listButton, buttonKey ) => {
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
								this.state.openRowId === rowKey
								? <PermissionsTable resource={resourceFormattedObject} resourceType='RESOURCE_MANAGER' isOwner={true} />
								: ''
							}
						</div>
					</td>
				</tr>
			</React.Fragment>
		)
	}

  renderResourceManager() {

		const clickedResource = this.state.clickedResource
		const clickedResourceForEditAndClone = this.state.clickedResourceForEditAndClone

    return (
			<>
				{
					(clickedResource === 'Price Book' || clickedResource === 'price_book')
						&& clickedResourceForEditAndClone !== 'price_book' &&
					<PriceBookCreator selectedResourceForClone={this.state.selectedResourceForClone}/>
				}
				{
					clickedResourceForEditAndClone === 'price_book' &&
					<PriceBookEditor/>
				}
				{
					clickedResourceForEditAndClone === 'tsm_manager' &&
					<TsmEditor/>
				}
				{
					clickedResourceForEditAndClone === 'roic_manager' &&
					<RoicEditor/>
				}
				{
					clickedResourceForEditAndClone === 'arpu_manager' &&
					<ArpuEditor/>
				}
				{
					clickedResourceForEditAndClone === 'impedance_mapping_manager' &&
					<ImpedanceEditor/>
				}
				{
					(clickedResource === 'Rate Reach Manager'|| clickedResource === 'rate_reach_manager')
						&& clickedResourceForEditAndClone !== 'rate_reach_manager' &&
					<RateReachManager selectedResourceForClone={this.state.selectedResourceForClone}/>
				}
				{
					clickedResourceForEditAndClone === 'rate_reach_manager' &&
					<RateReachEditor/>
				}
				{
					clickedResourceForEditAndClone === 'competition_manager' &&
					<CompetitorEditor/>
				}
				{
					clickedResourceForEditAndClone === 'fusion_manager' &&
					<FusionEditor onDiscard={this.handleOnDiscard}/>
				}
				{
					clickedResourceForEditAndClone === 'network_architecture_manager' &&
					<NetworkArchitectureEditor onDiscard={this.handleOnDiscard}/>
				}
				{
					clickedResourceForEditAndClone === 'planning_constraints_manager' &&
					<PlanningConstraintsEditor onDiscard={this.handleOnDiscard}/>
				}
			</>
    )
	}

	handleOnDiscard() {
		this.props.setIsResourceEditor(true)
	}

	onSortClick (colName) {
    if (this.state.selectedColumn === colName) {
      this.setState({ ...this.state, 'isOrderDesc': !this.state.isOrderDesc })
    } else {
      this.setState({ ...this.state, 'selectedColumn': colName })
    }
  }

	editSelectedManager(selectedManager) {
		this.props.startEditingResourceManager(selectedManager.id, selectedManager.resourceType,
			selectedManager.name, 'EDIT_RESOURCE_MANAGER'
		)
    if (selectedManager.resourceType === 'roic_manager') {
      const breadCrumbClone = klona(this.props.breadCrumb)
      breadCrumbClone.push('ROIC Settings')
      this.props.setBreadCrumb(breadCrumbClone)
    }
		this.setState({ clickedResourceForEditAndClone: selectedManager.resourceType, clickedResource: '' })
	}

	// Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before showing the SweetAlert
  fixBootstrapModal () {
		const modalNodes = document.querySelectorAll('.modal')
    if (!modalNodes) return

    modalNodes.forEach((modalNode) => {
      modalNode.removeAttribute('tabindex')
      modalNode.classList.add('js-swal-fixed')
    })
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before hiding the SweetAlert
  restoreBootstrapModal () {
    const modalNode = document.querySelector('.modal.js-swal-fixed')
    if (!modalNode) return

    modalNode.setAttribute('tabindex', '-1')
    modalNode.classList.remove('js-swal-fixed')
  }

  askNewResourceDetailsFromUser () {
		// Get the name for a new plan from the user
    this.fixBootstrapModal() // Workaround to show SweetAlert from within a modal dialog
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
        this.restoreBootstrapModal() // Workaround to show SweetAlert from within a modal dialog
        if (resourceName) {
          resolve(resourceName)
        } else {
					reject('Cancelled')
          if (this.props.breadCrumb[this.props.breadCrumb.length - 1] === 'ROIC Settings') {
            const breadCrumbClone = klona(this.props.breadCrumb)
            breadCrumbClone.pop()
            this.props.setBreadCrumb(breadCrumbClone)
          }
					this.setState({ clickedResource: '', clickedResourceForEditAndClone: '' })
        }
      })
    })
	}

	getNewResourceDetailsFromUser () {
		this.askNewResourceDetailsFromUser()
		.then((resourceName) => {
			if (resourceName) {
				this.setState({ clickedResource: '' })
				this.props.newManager(this.state.filterText, resourceName,this.props.loggedInUser,
					this.state.selectedResourceForClone.id
				)
        if (selectedManager.resourceType === 'roic_manager') {
          const breadCrumbClone = klona(this.props.breadCrumb)
          breadCrumbClone.push('ROIC Settings')
          this.props.setBreadCrumb(breadCrumbClone)
        }
				this.setState({ clickedResourceForEditAndClone: this.state.filterText })
			}
		})
		.catch((err) => console.error(err))
	}

	cloneSelectedManagerFromSource (selectedManager) {
		const resourceType = selectedManager.resourceType
		if (resourceType === 'price_book' || resourceType === 'rate_reach_manager') {
			this.props.setIsResourceEditor(false)
		} else {
			this.getNewResourceDetailsFromUser()
		}
    if (this.props.breadCrumb[this.props.breadCrumb.length - 1] === 'ROIC Settings') {
      const breadCrumbClone = klona(this.props.breadCrumb)
      breadCrumbClone.pop()
      this.props.setBreadCrumb(breadCrumbClone)
    }
		this.setState({ clickedResource: selectedManager.resourceType,
			clickedResourceForEditAndClone: '', selectedResourceForClone: selectedManager
		})
  }

	askUserToConfirmManagerDelete (managerName) {
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

	deleteSelectedResourceManager(selectedManager) {
		this.askUserToConfirmManagerDelete(selectedManager.name)
		.then((okToDelete) => {
			if (okToDelete) {
				this.props.deleteResourceManager(selectedManager, this.state.filterText)
			}
		})
		.catch((err) => console.error(err))
	}

  handleCanMakeNewFilter (clickedResource) {
		if (clickedResource !== 'Competition System') {
			this.props.setIsResourceEditor(false)
		}
    if (this.props.breadCrumb[this.props.breadCrumb.length - 1] === 'ROIC Settings') {
      const breadCrumbClone = klona(this.props.breadCrumb)
      breadCrumbClone.pop()
      this.props.setBreadCrumb(breadCrumbClone)
    }
		this.setState({ clickedResource, selectedResourceForClone: '', clickedResourceForEditAndClone: '' })
  }

  toggleRow (rowId) {
		if (this.state.openRowId === rowId) {
			rowId = null
		}
		this.setState({ ...this.state, 'openRowId': rowId })
  }

	handlePageClick (data) {
		this.props.nextOrPrevPageClick(data.selected)
		this.setState({ selectedPage: data.selected })
	}

	searchManagers() {
		const searchText = this.state.searchText
		this.props.searchManagers(searchText)
		this.props.getResourceManagers(this.state.filterText)
		this.setState({ searchText })
	}

	handleChange (event) {
		const searchText = event.target.value
		event.target.name = searchText
		this.setState({ searchText })
	}

	handleEnter(event) {
		if (event.key === 'Enter') {
			const searchText = this.state.searchText
			this.props.searchManagers(searchText)
			this.props.getResourceManagers(this.state.filterText)
			this.setState({ searchText })
		}
	}

	handlefilterManager (event) {
		const filterText = event.target.value
		const selectedResourceIndex = event.nativeEvent.target.selectedIndex
		const selectedResourceName = event.nativeEvent.target[selectedResourceIndex].text

		this.props.getResourceManagers(filterText)
		this.props.canMakeNewFilter(filterText)
		this.setState({ filterText })
		this.setState({ selectedResourceName })
	}
}

const mapStateToProps = (state) => ({
	resourceTypes: state.resourceEditor.resourceTypes,
	resourceManagers: state.resourceEditor.resourceManagers,
	pageableData: state.resourceEditor.pageableData,
	isMakeNewFilter: state.resourceEditor.isMakeNewFilter,
	isResourceEditor: state.resourceEditor.isResourceEditor,
	loggedInUser: state.user.loggedInUser
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
