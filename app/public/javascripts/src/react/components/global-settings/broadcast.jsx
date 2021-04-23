import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'

export class Broadcast extends Component {
  constructor (props) {
    super(props)
    this.state = { subject: '', body: '', isChecked: true }
  }

  render() {
    const { subject, text, isChecked } = this.state
    return (
      <div className="no-collapse" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: '1 1 auto' }}>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => this.toggleChange()}
              />
              &nbsp;Disappear after 15 Seconds
            </label>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              className="form-control"
              value={subject}
              onChange={(event) => this.handleSubjectChange(event)}
            />
          </div>
          <div className="form-group">
            <label>Text</label>
            <textarea
              className="form-control"
              rows="12"
              value={text}
              onChange={(event) => this.handleBodyChange(event)}
            />
          </div>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button
            type="button"
            className="btn btn-primary float-right"
            onClick={() => this.confirmBroadcast()}
          >
            <i className="fa fa-save" />
            &nbsp;&nbsp;Send
          </button>
        </div>
      </div>
    )
  }

  handleSubjectChange(event) {
    this.setState({ subject: event.target.value })
  }

  handleBodyChange(event) {
    this.setState({ body: event.target.value })
  }

  toggleChange() {
    const { isChecked } = this.state
    this.setState({ isChecked: !isChecked })
  }

  confirmBroadcast() {
    swal({ // eslint-disable-line
      title: 'Are you sure?',
      text: 'This message will be broadcast to all users. Are you sure you wish to proceed?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, Broadcast!',
      showCancelButton: true,
      closeOnConfirm: true
    }, (confirmed) => {
      confirmed && this.props.broadcastMessage(this.state)
    })
  }
}

const mapDispatchToProps = (dispatch) => ({
  broadcastMessage: (message) => dispatch(globalsettingsActions.broadcastMessage(message)),
})

export default wrapComponentWithProvider(reduxStore, Broadcast, null, mapDispatchToProps)
