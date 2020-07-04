import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ResourceActions from './resource-actions'
import './resource-editor.css';
import ReactPaginate from 'react-paginate';
import PriceBookCreator  from './pricebook-creator.jsx';
import RateReachManager  from './rate-reach-creater.jsx';
import CompetitorEditor  from './competitor-editor.jsx';
import PermissionsTable from '../acl/resource-permissions/permissions-table.jsx'
import FusionEditor from '../resource-manager/fusion-editor.jsx'
import ResourceManagerActions from '../resource-manager/resource-manager-actions'
import NetworkArchitectureEditor from '../resource-manager/network-architecture-editor.jsx'
import PlanningConstraintsEditor from '../resource-manager/planning-constraints-editor.jsx'
import ArpuEditor from '../resource-editor/arpu-editor.jsx'

export class ResourceEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
			selectedPage:0,
			searchText:'',
			filterText:'',
			selectedResourceName : '',
			openRowId: null,
			clickedResource : '',
			selectedResourceForClone : '',
			clickedResourceForEdit : ''
		}
		
		this.actionsECD = [
      {
        buttonText: 'Edit', // Edit
        buttonClass: 'btn-light',
        iconClass: 'fa-edit',
        toolTip: 'Edit',
        isEnabled: (row, index) => {
          return this.canEdit(row)
        },
        callBack: (row, index) => {
          this.editSelectedManager(row)
        }
      },
      {
        buttonText: 'Clone', // Clone
        buttonClass: 'btn-light',
        iconClass: 'fa-copy',
        toolTip: 'Clone',
        callBack: (row, index) => {
          this.cloneSelectedManagerFromSource(row)
        }
      },
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        isEnabled: (row, index) => {
          return this.canAdmin(row)
        },
        callBack: (row, index) => {
          this.deleteSelectedResourceManager(row)
        }
      }
		]		
	}

  componentWillMount () {
    this.props.getResourceTypes();
    this.props.getResourceManagers('all');
    this.props.canMakeNewFilter();
  }

  render () {
    return !this.props.resourceTypes
    ? null
    : <>
				{
          this.props.isResourceEditor
          ? this.renderResourceEditor()
          : this.renderResourceManager()
        }
      </>
  }

  renderResourceEditor(){
    let paginationElement;
    if (this.props.pageableData.pageCount > 1) {
			paginationElement = (
				<ReactPaginate 
					previousLabel={'«'}
					nextLabel={'»'}  
					breakLabel={<span className="gap">...</span>} 
					pageCount={this.props.pageableData.pageCount} 
					onPageChange={(e)=>this.handlePageClick(e)}
					forcePage={this.props.pageableData.currentPage} 
					activeClassName={"active"} 
					containerClassName={'pagination'} 
					pageClassName={'page-item'} 
					pageLinkClassName={'page-link'} 
					previousLinkClassName={'page-link'}
					nextLinkClassName={'page-link'}
				/> 
			);
    }

    return (
			<div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
					<div style={{flex: '0 0 auto'}}>
						<div className="form-group row">
								<label className="col-sm-4 col-form-label">Filter by Resource Type:</label>
								<div className="col-sm-8">
									<select className="form-control"  onChange={(e)=>this.handlefilterManager(e)} value={this.state.filterText}>
										<option key="all" value="all">all</option>
										{this.props.resourceTypes.map(item => <option value={item.name} key={item.name}>{item.description}</option>)}
									</select>
								</div>
						</div>
						<div className="form-group row">
							<label className="col-sm-4 col-form-label">Search Name:</label>
							<div className="col-sm-8 input-group">
								<input type="text" className="form-control input-sm" onChange={(e)=>this.handleChange(e)}
									onKeyDown={(e)=>this.handleEnter(e)} name="searchText" value={this.state.searchText}/>                            
								<button className="btn btn-light input-group-append" style={{cursor:'pointer'}} onClick={(e) => this.searchManagers(e)}>
									<span className="fa fa-search"></span>
								</button>
							</div>
						</div>
					</div>
					<div className="ei-table-contain" style={{flex: '1 1 auto', overflowY: 'auto'}}>
						<table className="table table-sm ei-table-foldout-striped" style={{borderBottom:"1px solid #dee2e6"}}>
							<thead className="thead-dark">
								<tr>
									<th></th>
									<th>Name
										<div className="ei-table-col-sort-icon">
											<i className="fa fa-chevron-up" aria-hidden="true"> </i>
										</div>
									</th>
									<th>Resource Type</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{	
									this.props.pageableData.paginateData.map(( listValue, rowKey ) => {
										const resourceFormattedObject = { identifier:listValue.id, dataType:listValue.resourceType, name:listValue.name, permissions:63, id:listValue.id}
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
														<button className="btn btn-sm ng-class: btnValue.buttonClass;" 
															data-toggle="tooltip" data-placement="bottom" title="{{btnValue.toolTip}}"><i className="fa ei-button-icon"></i></button>
														<div className="btn-group">
															<button type="button" className="btn btn-sm" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
															<i className="fa fa-bars ei-button-icon"></i>
															</button>
															<div className="dropdown-menu dropdown-menu-right">
																{
																	this.actionsECD.map(( listButton, buttonKey ) => {
																		return 	<React.Fragment key={buttonKey}>
																							<button className="dropdown-item" type="button" onClick={() => listButton.callBack(listValue, rowKey)}>{listButton.buttonText}</button>
																						</React.Fragment>
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
										);
									})
								}                                   
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
									<button onClick={(e)=>this.handleCanMakeNewFilter(e)} value={this.state.selectedResourceName} className="btn btn-light btn-block">
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

  renderResourceManager(){
		let clickedResource = this.state.clickedResource;
		let clickedResourceForEdit = this.state.clickedResourceForEdit.resourceType;
    return (
			<>
				{
					(clickedResource === 'Price Book' || clickedResource === 'price_book')  &&
					<PriceBookCreator selectedResourceForClone={this.state.selectedResourceForClone}/>
				}  
				{
					(clickedResource === 'Rate Reach Manager'|| clickedResource === 'rate_reach_manager')  &&
					<RateReachManager selectedResourceForClone={this.state.selectedResourceForClone}/>
				}
				{
					clickedResourceForEdit === 'fusion_manager' &&
					<FusionEditor/>
				}
				{
					clickedResourceForEdit === 'network_architecture_manager' &&
					<NetworkArchitectureEditor/>
				}
				{
					clickedResourceForEdit === 'planning_constraints_manager' &&
					<PlanningConstraintsEditor/>
				}
				{
					clickedResourceForEdit === 'arpu_manager' &&
					<ArpuEditor selectedResourceForEdit={this.state.clickedResourceForEdit}/>
				}				
			</>
    )
	}

	editSelectedManager(selectedManager){
		this.props.setIsResourceEditor();
		this.setState({clickedResourceForEdit: selectedManager, clickedResource:''})
		this.props.startEditingResourceManager(selectedManager.id, selectedManager.resourceType, selectedManager.name, 'EDIT_RESOURCE_MANAGER')
	}

	// Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before showing the SweetAlert
  fixBootstrapModal () {
    var modalNodes = this.$document[0].querySelectorAll('.modal')
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
    var modalNode = this.$document[0].querySelector('.modal.js-swal-fixed')
    if (!modalNode) return

    modalNode.setAttribute('tabindex', '-1')
    modalNode.classList.remove('js-swal-fixed')
  }

  askNewResourceDetailsFromUser () {
    // Get the name for a new plan from the user
    return new Promise((resolve, reject) => {
      swal({
        title: 'Resource name required',
        text: 'Enter the name of the new resource',
				type: 'input',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'OK',
     }, (result) => {
        if (result) {
          resolve('Ok')
        } else {
          resolve('Cancelled')
        }
      })
    })
	}
	
	getNewResourceDetailsFromUser () {
		this.askNewResourceDetailsFromUser()
		.then((resourceName) => {
			if (resourceName) {
			}
		})
		.catch((err) => console.error(err))
	}

	cloneSelectedManagerFromSource (selectedManager) {
		this.props.setIsResourceEditor();
		this.setState({clickedResource: selectedManager.resourceType,
									selectedResourceForClone: selectedManager})
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

	deleteSelectedResourceManager(selectedManager){
		this.askUserToConfirmManagerDelete(selectedManager.name)
		.then((okToDelete) => {
			if (okToDelete) {
				this.props.deleteResourceManager(selectedManager, this.state.filterText)
			}
		})
		.catch((err) => console.error(err))
	}

  handleCanMakeNewFilter (e) {      
		let clickedResource = e.target.value;
		if(clickedResource !== 'Competition System'){
			this.props.setIsResourceEditor();
		}
		this.setState({clickedResource: clickedResource, selectedResourceForClone: ''})
  }

  toggleRow (rowId) {
		if (this.state.openRowId === rowId) {
				rowId = null
		}
		this.setState({ ...this.state, 'openRowId': rowId })
  }

	handlePageClick (data) { 
		this.props.nextOrPrevPageClick(data.selected)
		this.setState({selectedPage: data.selected})
	}

	searchManagers() {
		let searchText = this.state.searchText;
		this.props.searchManagers(searchText)
		this.setState({searchText: searchText})
	}

	handleChange (e) {      
		let searchText = e.target.value;
		e.target.name = searchText;
		this.setState({ searchText: searchText });
	}
	
	handleEnter(e){
		if(e.key === 'Enter'){
			let searchText = this.state.searchText;
			this.props.searchManagers(searchText)
			this.setState({searchText: searchText})
		}
	}

	handlefilterManager(e) {
		let filterText = e.target.value;
		let selectedResourceIndex = e.nativeEvent.target.selectedIndex;
		let selectedResourceName = e.nativeEvent.target[selectedResourceIndex].text;

		this.props.getResourceManagers(filterText)
		this.props.canMakeNewFilter(filterText)
		this.setState({filterText: filterText})
		this.setState({selectedResourceName: selectedResourceName})
	}
}

const mapStateToProps = (state) => ({
	resourceTypes: state.resourceEditor.resourceTypes,
	resourceManagers: state.resourceEditor.resourceManagers,
	pageableData:  state.resourceEditor.pageableData,
	isMakeNewFilter:  state.resourceEditor.isMakeNewFilter,
	isResourceEditor : state.resourceEditor.isResourceEditor,
})   

const mapDispatchToProps = (dispatch) => ({
	getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
	getResourceManagers: (filterText) => dispatch(ResourceActions.getResourceManagers(filterText)),
	nextOrPrevPageClick: (selectedPage) => dispatch(ResourceActions.nextOrPrevPageClick(selectedPage)),
	searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
	canMakeNewFilter: (filterText) => dispatch(ResourceActions.canMakeNewFilter(filterText)),
	setIsResourceEditor: () => dispatch(ResourceActions.setIsResourceEditor()),
	deleteResourceManager: (selectedManager, filterText) => dispatch(ResourceActions.deleteResourceManager(selectedManager, filterText)),
	startEditingResourceManager: (id, type, name, editingMode) => dispatch(ResourceManagerActions.startEditingResourceManager(id, type, name, editingMode))
})

const ResourceEditorComponent = wrapComponentWithProvider(reduxStore, ResourceEditor, mapStateToProps, mapDispatchToProps)
export default ResourceEditorComponent
