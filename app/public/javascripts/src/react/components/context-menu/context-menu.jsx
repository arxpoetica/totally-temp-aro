import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ContextMenuActions from '../context-menu/actions'
import PlanEditorActions from '../plan-editor/plan-editor-actions'
import ViewSettingsActions from '../view-settings/view-settings-actions'
import MenuItemFeature from './menu-item-feature'
import './context-menu.css'

export class ContextMenu extends Component {
  constructor (props) {
    super(props)
    this.MAX_MENU_ITEMS = 6
    this.handleBackdropMouseDown = this.handleBackdropMouseDown.bind(this)
    this.actionModules = {
      PlanEditorActions: PlanEditorActions,
      ViewSettingsActions: ViewSettingsActions,
    }
  }

  render () {
    return this.props.isVisible ? this.renderContextMenu() : null
  }

  renderContextMenu () {
    // The menu will be positioned using inlinestyles
    const menuCss = {
      left: this.props.x,
      top: this.props.y
    }
    // When the user clicks anywhere on the backdrop OR the menu items, hide the menu
    return <div className='context-menu-backdrop' onMouseDown={this.handleBackdropMouseDown}>
      <div className='context-menu-container' style={menuCss}>
        <div className='dropdown open context-menu-dropdown'>
          <div className='dropdown-menu context-menu-dropdown' onContextMenu={() => false}>
            {/* Show a button at the top IF there are too many menu items. The button will scroll the menu items */}
            {/* <button ng-if='$ctrl.menuItems.length > MAX_MENU_ITEMS' className='btn btn-sm btn-block btn-light p-0' ng-click='$ctrl.scrollMenuUp()' ng-disabled='$ctrl.startMenuIndex === 0'>
              <i className='fa fas fa-caret-up' />
            </button> */}
            {/* The top level menu items */}
            {
              this.props.menuItemFeatures.map((menuItemFeature, index) => this.renderMenuItemFeature(menuItemFeature, index, this.props.menuItemFeatures.length))
            }
            {/* Show a button at the bottom IF there are too many menu items. The button will scroll the menu items */}
            {/* <button ng-if='$ctrl.menuItems.length > MAX_MENU_ITEMS' className='btn btn-sm btn-block btn-light p-0' ng-click='$ctrl.scrollMenuDown()' ng-disabled='$ctrl.startMenuIndex + $ctrl.MAX_MENU_ITEMS === $ctrl.menuItems.length'>
              <i className='fa fas fa-caret-down' />
            </button> */}
          </div>
        </div>
      </div>
    </div>
  }

  renderMenuItemFeature (menuItem, menuItemIndex, numberOfMenuItems) {
    const featureTypeToLabel = {
      BOUNDARY: {
        text: 'Boundary',
        cssClass: 'badge badge-primary badge-boundary'
      },
      EQUIPMENT: {
        text: 'Equipment',
        cssClass: 'badge badge-primary badge-equipment'
      },
      CONSTRUCTION_AREA: {
        text: 'Construction Area',
        cssClass: 'badge badge-primary badge-equipment'
      },
      LOCATION: {
        text: 'Location',
        cssClass: 'badge badge-primary badge-location'
      },
      SERVICE_AREA: {
        text: 'Service Area',
        cssClass: 'badge badge-primary badge-service-area'
      },
      CENSUS: {
        text: 'Census block',
        cssClass: 'badge badge-primary badge-service-area'
      }
    }
    return <div className='dropdown-item aro-dropdown-item' href='#' key={menuItemIndex}>
      {/* Render the label based on the equipment type */}
      {menuItem.type in featureTypeToLabel
        ?  <div className={`${featureTypeToLabel[menuItem.type].cssClass} mr-2`}>
            {featureTypeToLabel[menuItem.type].text}
          </div>
        : null
      }
      {menuItem.label}
      <i className='fa-caret-right fas ml-2' />
      {/* Render actions */}
      { this.renderMenuItemActions(menuItem.actions, menuItemIndex, numberOfMenuItems) }
    </div>
  }

  renderMenuItemActions (menuItemActions, menuItemIndex, numberOfMenuItems) {
    // For the sub-menu, the top is calculated by offsetting by the index of the item, plus the
    // height of the scroll button (if it exists). Would be better if these constants can be removed
    const actionTypeToLabel = {
      ADD_BOUNDARY: {
        text: 'Add Boundary',
        cssClass: 'fas fa-plus pl-2 pr-2'
      },
      SELECT: {
        text: 'Select',
        cssClass: 'fas fa-mouse-pointer pl-2 pr-2'
      },
      VIEW: {
        text: 'View',
        cssClass: 'fa fa-eye pl-2 pr-2'
      },
      EDIT: {
        text: 'Edit',
        cssClass: 'fas fa-pencil-alt pl-2 pr-2'
      },
      DELETE: {
        text: 'Delete',
        cssClass: 'fas fa-trash-alt pl-2 pr-2'
      },
      DELETE_ALL: {
        text: 'Delete All',
        cssClass: 'fas fa-trash-alt pl-2 pr-2'
      },
      ADD: {
        text: 'Add',
        //cssClass: 'fas fa-circle-plus pl-2 pr-2'
        cssClass: 'fas fa-mouse-pointer pl-2 pr-2'
      },
      REMOVE: {
        text: 'Remove',
        //cssClass: 'fas fa-circle-minus pl-2 pr-2'
        cssClass: 'fas fa-trash-alt pl-2 pr-2'
      },
      MERGE: {
        text: 'Merge',
        //cssClass: 'fas fa-circle-minus pl-2 pr-2'
        cssClass: 'fas fa-object-group pl-2 pr-2'
      },
    }
    return <ul className='dropdown-menu sub-menu' >
      {
        menuItemActions.map((menuItemAction, actionIndex) => {
          return <li
            className='dropdown-item aro-dropdown-item'
            key={actionIndex}
            onClick={event => this.handleActionClicked(event, menuItemAction)}
            onMouseDown={event => event.stopPropagation()} // Stop propagation, else the menu will be hidden and no click will be registered
          >
            <a href='#' className='dropdown-item aro-dropdown-item' style={{ padding: 0 }}>
              <div>
                <i className={actionTypeToLabel[menuItemAction.type].cssClass} />
                {menuItemAction.label || actionTypeToLabel[menuItemAction.type].text}
              </div>
            </a>
          </li>
        })
      }
    </ul>
  }

  handleBackdropMouseDown (event) {
    // When the backdrop is clicked, hide the context menu. Note that when a user clicks on a menu item,
    // that click event will also propagate to the backdrop. Prevent further propagation.
    this.props.hideContextMenu()
    event.stopPropagation()
  }

  handleActionClicked (event, menuItemAction) {
    // Get the action creator to fire
    const actionCreator = this.actionModules[menuItemAction.actionCreatorClass][menuItemAction.actionCreatorMethod]
    if (actionCreator) {
      this.props.dispatchActionCreator(actionCreator, menuItemAction.payload)
    } else {
      console.error(`Menu item was clicked but action creator not found: ${menuItemAction.actionCreatorClass}.${menuItemAction.actionCreatorMethod}`)
    }
    this.props.hideContextMenu()
    event.stopPropagation()
  }
}

ContextMenu.propTypes = {
  isVisible: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
  menuItemFeatures: PropTypes.arrayOf(PropTypes.instanceOf(MenuItemFeature))
}

const mapStateToProps = state => ({
  isVisible: state.contextMenu.isVisible,
  x: state.contextMenu.coordinateX,
  y: state.contextMenu.coordinateY,
  menuItemFeatures: state.contextMenu.menuItemFeatures
})

const mapDispatchToProps = dispatch => ({
  hideContextMenu: () => dispatch(ContextMenuActions.hideContextMenu()),
  dispatchActionCreator: (actionCreator, payload) => dispatch(actionCreator(...payload))
})

const ContextMenuComponent = wrapComponentWithProvider(reduxStore, ContextMenu, mapStateToProps, mapDispatchToProps)
export default ContextMenuComponent
