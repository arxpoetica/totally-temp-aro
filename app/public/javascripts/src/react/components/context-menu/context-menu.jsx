import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ContextMenuActions from '../context-menu/actions'
import MenuItemFeature from './menu-item-feature'
import './context-menu.css'

export class ContextMenu extends Component {
  constructor (props) {
    super(props)
    this.MAX_MENU_ITEMS = 6
    this.handleBackdropMouseDown = this.handleBackdropMouseDown.bind(this)
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
      <div className={featureTypeToLabel[menuItem.type].cssClass}>
        {featureTypeToLabel[menuItem.type].text}
      </div>
      {/* Render actions */}
      { this.renderMenuItemActions(menuItem.actions, menuItemIndex, numberOfMenuItems) }
    </div>
  }

  renderMenuItemActions (menuItemActions, menuItemIndex, numberOfMenuItems) {
    // For the sub-menu, the top is calculated by offsetting by the index of the item, plus the
    // height of the scroll button (if it exists). Would be better if these constants can be removed
    const actionTypeToLabel = {
      ADD_BOUNDAR: {
        text: 'Add boundary',
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
      }
    }
    return <ul className='dropdown-menu sub-menu' style={{ top: (menuItemIndex * 38 + (numberOfMenuItems > this.MAX_MENU_ITEMS ? 20 : 0)) + 'px', padding: '0px' }}>
      {
        menuItemActions.map((menuItemAction, actionIndex) => {
          return <li className='dropdown-item aro-dropdown-item' key={actionIndex}>
            <a href='#' className='dropdown-item aro-dropdown-item' style={{ padding: 0 }}>
              <i className={actionTypeToLabel[menuItemAction.type].cssClass}>
                {actionTypeToLabel[menuItemAction.type].text}
              </i>
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
  hideContextMenu: () => dispatch(ContextMenuActions.hideContextMenu())
})

const ContextMenuComponent = wrapComponentWithProvider(reduxStore, ContextMenu, mapStateToProps, mapDispatchToProps)
export default ContextMenuComponent
