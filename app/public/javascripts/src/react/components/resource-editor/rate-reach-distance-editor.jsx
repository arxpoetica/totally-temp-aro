import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class RateReachDistanceEditor extends Component {
  constructor(props) {
    super(props)

    this.state = {
      editableCategories: [],
      isCategoryInEditMode: false,
      categories: ''
    }

    this.editableCategories = []
    this.isCategoryInEditMode = []
  }

  componentDidMount() {
    // Use JQuery-UI Sortable to allow the table rows to be sorted using drag-and-drop
    const sortableBody = jQuery('#rateReachDistanceEditorSortableBody')
    sortableBody.sortable({
      handle: '.row-draggable-handle',
      stop: this.handleSortOrderChanged.bind(this)
    })
    sortableBody.disableSelection()
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.categories === '') {
      return {
        categories: nextProps.categories,
      };
    } else {
      return {
        categories: nextProps.categories,
      };
    }
  }

  handleSortOrderChanged(event, ui) {
    // The JQuery UI "sortable" widget has sorted the <tr> with the category, but our model has not updated.
    // We will loop through the <tr>'s in the DOM and create a new model array with the new order, and then
    // force angularjs to re-bind to our new model array.
    const newCategories = []
    const tableRows = jQuery('#rateReachDistanceEditorSortableBody tr')
    for (var iRow = 0; iRow < tableRows.length; ++iRow) {
      // The element ID contains the old index of the category
      const rowId = tableRows[iRow].id
      const oldIndex = +rowId.substring(rowId.lastIndexOf('_') + 1)
      newCategories[iRow] = this.state.categories[oldIndex]
    }
    this.props.onRateReachEditChange(newCategories)
    this.setState({ categories: newCategories })
  }

  render() {
    return this.state.categories === null
      ? null
      : this.renderRateReachDistanceEditor()
  }

  renderRateReachDistanceEditor() {

    const { categoryDescription, technologies, rateReachGroupMap, selectedTechnologyType, categoryType } = this.props
    const { editableCategories, categories } = this.state

    return (
      <React.Fragment>
        <div id="verticalscroll" className="tableFixHead">
          <table id="tblrateReachConfig" className="table table-sm table-striped">
            <thead className="thead-dark">
              <tr>
                <th>&nbsp;&nbsp;&nbsp;</th>{/*<!-- This is for the draggable handle for each row --> */}
                <th style={{ minWidth: '200px' }}>{categoryDescription}</th>
                {rateReachGroupMap[selectedTechnologyType].matrixMap.map((item, keyValue) => {
                  return (
                    <th style={{ whiteSpace: 'nowrap' }} key={keyValue}>
                      {technologies[item.id] !== undefined &&
                        technologies[item.id].name
                      }
                    </th>
                  )
                })
                }
              </tr>
            </thead>
            <tbody id="rateReachDistanceEditorSortableBody">
              {categories.map((category, index) => {
                return (
                  <tr key={index} id={`rrDistanceEditorRow_${index}`}>
                    <td className="row-draggable-handle"><i className="fas fa-grip-vertical" style={{ color: '#a0a0a0' }}></i></td>
                    {!this.isCategoryInEditMode[index] &&
                      <td className="category-description" style={{ minWidth: '200px' }}>
                        {category.description}
                        <div className="float-right">
                          <button className="btn btn-sm btn-light category-hover-button" onClick={(event) =>
                            this.handleCategoryInEditMode(index)}><i className="fa fa-edit"></i></button>
                          <button className="btn btn-sm btn-danger category-hover-button" onClick={(event) =>
                            this.removeCategory(index)}><i className="fa fa-trash-alt"></i></button>
                        </div>
                      </td>
                    }
                    {this.isCategoryInEditMode[index] &&
                      <td className="input-group">
                        {categoryType === 'SPEED' &&
                          <div className="row ml-0 mr-0">
                            <input className="form-control col-sm-4 category-description" name="speed"
                              onChange={(event) => this.handleEditableCategoriesChange(event, index)}
                              value={editableCategories[index].speed} />
                            <select className="form-control col-sm-6" name="units" onChange={(event) =>
                              this.handleEditableCategoriesChange(event, index)} value={editableCategories[index].units}>
                              <option>Mbps</option>
                              <option>Gbps</option>
                            </select>
                            <button className="btn btn-light col-sm-2 p-0" onClick={(event) =>
                              this.saveCategory(index)}><i className="fa fa-save"></i></button>
                          </div>
                        }
                        {categoryType === 'BAND' &&
                          <div>
                            <small>Name:</small>
                            <input className="form-control form-control-sm category-description" name="name" onChange={(event) =>
                              this.handleEditableCategoriesChange(event, index)} value={editableCategories[index].name} />
                            <small>Description:</small>
                            <input className="form-control form-control-sm category-description" name="description"
                              onChange={(event) => this.handleEditableCategoriesChange(event, index)}
                              value={editableCategories[index].description} />
                            <button className="btn btn-light" onClick={(event) => this.saveCategory(index)}>
                              <i className="fa fa-save"></i></button>
                          </div>
                        }
                      </td>
                    }
                    {Object.entries(rateReachGroupMap[selectedTechnologyType].matrixMap).map(([techKey], techIndex) => {
                      let metersToLengthUnits = this.props.convertMetersToLengthUnits(rateReachGroupMap[selectedTechnologyType]
                        .matrixMap[techIndex].value[index].distance);
                      return (
                        <td key={techIndex} style={{ minWidth: '100px' }}>

                          <div className="input-group mb-3">
                            <input className="form-control border-right-0" style={{ minWidth: '6em' }}
                              onChange={(event) => this.handleRateReachGroupMapChange(event, selectedTechnologyType, index, techIndex)}
                              value={metersToLengthUnits} />
                            <div className="input-group-prepend">
                              <span className="input-group-text text-muted border-left-0 bg-white">ft</span>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
              }
            </tbody>
          </table>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ textAlign: 'left' }}>
            {/* If the user is allowed to edit categories, show a button to add categories */}
            <button className="btn btn-light" onClick={(event) => this.addCategory()}>Add</button>
          </div>
        </div>
      </React.Fragment>
    )
  }

  handleRateReachGroupMapChange(event, selectedTechnologyType, index, techIndex) {
    let lengthUnitsToMeters = this.props.convertlengthUnitsToMeters(event.target.value);
    this.props.rateReachGroupMap[selectedTechnologyType].matrixMap[techIndex].value[index].distance = lengthUnitsToMeters
    this.setState({ isCategoryInEditMode: false })
    this.props.onRateReachMatrixChange(this.props.rateReachGroupMap)
  }

  handleEditableCategoriesChange(event, index) {
    var preEditableCategories = this.state.editableCategories
    preEditableCategories[index][event.target.name] = event.target.value
    this.setState({ editableCategories: preEditableCategories })
  }

  handleCategoryInEditMode(index) {
    this.isCategoryInEditMode[index] = true
    this.editableCategories = []
    if (this.state.categories) {
      this.state.categories.forEach(category => {
        this.editableCategories.push((this.props.categoryType === 'SPEED') ? SpeedCategory.fromServiceCategory(category) : category)
      })
    }
    this.setState({ editableCategories: this.editableCategories })
  }

  addCategory() {

    // Add a new category and also add placeholder values for the categories
    var newCategory = null
    if (this.props.categoryType === 'SPEED') {
      newCategory = new SpeedCategory(1, 'Mbps')
      this.state.categories.push(newCategory.toServiceCategory())
    } else {
      newCategory = {
        name: 'New category',
        description: 'New category'
      }
      this.state.categories.push(newCategory)
    }
    this.editableCategories.push(newCategory)

    this.setState({ editableCategories: this.editableCategories })
    this.props.onRateReachEditChange(this.state.categories)

    Object.keys(this.props.rateReachGroupMap).forEach(technology => {
      Object.keys(this.props.rateReachGroupMap[technology].matrixMap).forEach((technologyRef, index) => {
        this.props.rateReachGroupMap[technology].matrixMap[index].value.push({
          distance: 0,
          speed: 1
        })
      })
    })
  }

  removeCategory(categoryIndex) {
    this.state.categories.splice(categoryIndex, 1)
    this.isCategoryInEditMode.splice(categoryIndex, 1)
    this.setState({ isCategoryInEditMode: this.isCategoryInEditMode })
    this.props.onRateReachEditChange(this.state.categories)
    Object.keys(this.props.rateReachGroupMap).forEach(technology => {
      Object.keys(this.props.rateReachGroupMap[technology].matrixMap).forEach((technologyRef, index) => {
        this.props.rateReachGroupMap[technology].matrixMap[index].value.splice(categoryIndex, 1)
      })
    })
  }

  saveCategory(index) {
    // Copies over the "editable" category onto the service-formatted category
    if (this.props.categoryType === 'SPEED') {
      this.state.categories[index] = this.editableCategories[index].toServiceCategory()
      this.props.onRateReachEditChange(this.state.categories)
      // We should also copy over the speeds to all the distance/speed maps
      const multiplier = this.editableCategories[index].units === 'Gbps' ? 1000 : 1
      const speedMbps = this.editableCategories[index].speed * multiplier
      Object.keys(this.props.rateReachGroupMap).forEach(technology => {
        this.props.rateReachGroupMap[technology].matrixMap.forEach((item, tIndex) => {
          this.props.rateReachGroupMap[technology].matrixMap[tIndex].value.forEach((item, arrIndex) => {
            if (index === arrIndex) {
              this.props.rateReachGroupMap[technology].matrixMap[tIndex].value[arrIndex].speed = speedMbps
            }
          })
        })
      })
    } else {
      this.state.categories[index] = this.editableCategories[index]
      this.props.onRateReachEditChange(this.state.categories)
      this.setState({ isCategoryInEditMode: false })
      // No need to copy over the speeds to the distance/speed maps
    }
    this.isCategoryInEditMode[index] = false
    this.setState({ isCategoryInEditMode: false })
  }
}

class SpeedCategory {
  constructor(speed, units) {
    this.speed = speed
    this.units = units
  }

  toServiceCategory() {
    // Format the category in aro-service format
    const label = `${this.speed} ${this.units}`
    const multiplier = this.units === 'Mbps' ? 1 : 1000
    return {
      name: label,
      description: label,
      speed: (+this.speed) * multiplier
    }
  }

  static fromServiceCategory(serviceCategory) {

    // Create a SpeedCategory object from an aro-service object formatted using the SpeedCategory.toServiceCategory() object
    if (serviceCategory.name !== serviceCategory.description) {
      console.warn('Service category name and description are different. They should be the same. Attempting to continue with name...')
    }
    const parts = serviceCategory.name.split(' ')
    if (parts.length !== 2) {
      console.warn(`Expecting exactly 2 parts after splitting service category name, got ${parts.length}. Attempting to continue...`)
    }
    if (parts[1] !== 'Mbps' && parts[1] !== 'Gbps') {
      console.warn('Category units should be Mbps or Gbps')
    }
    return new SpeedCategory(+serviceCategory.speed, parts[1])
  }
}

const mapStateToProps = (state) => ({
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  loggedInUser: state.user.loggedInUser,
  rateReachManager: state.resourceEditor.rateReachManager,
  rateReachManagerConfigs: state.resourceEditor.rateReachManagerConfigs,
})

const mapDispatchToProps = (dispatch) => ({
  convertMetersToLengthUnits: (input) => dispatch(ResourceActions.convertMetersToLengthUnits(input)),
  convertlengthUnitsToMeters: (input) => dispatch(ResourceActions.convertlengthUnitsToMeters(input)),
})

const RateReachDistanceEditorComponent = connect(mapStateToProps, mapDispatchToProps)(RateReachDistanceEditor)
export default RateReachDistanceEditorComponent
