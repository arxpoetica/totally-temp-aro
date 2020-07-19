import React, { Component } from 'react'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import reduxStore from '../../../redux-store'

// Note: the css is in map-split.js
// this is because the note for Rendering Tiles uses a seperate system in state.js
// because there is a problem with that system that causes the note to be constantly fired

export class UINotifications extends Component {
  render () {
    var noteRows = []
    // inverse order
    var notesList = Object.values(this.props.notifications).sort((a, b) => a.order - b.order)

    notesList.forEach(ele => {
      noteRows.push(this.renderNotificationRow(ele.notification))
    })
    return noteRows
  }

  renderNotificationRow (notification) {
    return <div key={`noteId_${notification.noteId}`} className="ui-note-noteline">
      {notification}
    </div>
  }
}

const mapStateToProps = state => {
  return {
    notifications: state.notification.notifications
  }
}

const UINotificationsComponent = wrapComponentWithProvider(reduxStore, UINotifications, mapStateToProps)
export default UINotificationsComponent
