import React, { Component } from 'react'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import reduxStore from '../../../redux-store'

// Note: the css is in map-split.js
// this is because the note for Rendering Tiles uses a seperate system in state.js
// because there is a problem with that system that causes the note to be constantly fired

export class UINotifications extends Component {
  render () {
    var noteRows = []
    var notesList = Object.values(this.props.notifications).sort((a, b) => b.order - a.order)
    notesList.forEach(ele => {
      noteRows.push(this.renderNotificationRow(ele))
    })
    return noteRows
  }

  renderNotificationRow (note) {
    return <div key={`noteId_${note.noteId}`} className="ui-note-noteline">
      {note.notification}
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
