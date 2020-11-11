import React, { Component } from 'react'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import reduxStore from '../../../redux-store'
import NotificationActions from './notification-actions'
import NotificationTypes from './notification-types'

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
    var noteRow
    if (note.type === NotificationTypes['USER_EXPIRE']) {
      noteRow = this.renderUserExpireNote(note)
    } else {
      noteRow = this.renderSystemExpireNote(note)
    }
    return noteRow
  }

  renderSystemExpireNote (note) {
    return <div key={`noteId_${note.noteId}`} className="ui-note-noteline">
      {note.notification}
    </div>
  }

  renderUserExpireNote (note) {
    return <div key={`noteId_${note.noteId}`} className="ui-note-noteline ui-note-persistent">
      {note.notification} 
      <button type="button" className="btn btn-sm btn-light ui-note-button"
        onClick={event => { this.onCloseClick(event, note.noteId) }}>
        <div className="fa fa-2x fa-times"></div>
      </button>
    </div>
  }

  onCloseClick (event, id) {
    this.props.removeNotification(id)
  }

}

const mapStateToProps = state => {
  return {
    notifications: state.notification.notifications
  }
}

const mapDispatchToProps = (dispatch) => ({
  removeNotification: (noteId) => dispatch(NotificationActions.removeNotification(noteId))
})

const UINotificationsComponent = wrapComponentWithProvider(reduxStore, UINotifications, mapStateToProps, mapDispatchToProps)
export default UINotificationsComponent
