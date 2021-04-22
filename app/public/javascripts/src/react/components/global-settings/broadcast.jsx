import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'

export class Broadcast extends Component {
  constructor (props) {
    super(props)
    this.state = { subject: '', body: '', isChecked: true }

    this.handleSubjectChange = this.handleSubjectChange.bind(this)
    this.handleBodyChange = this.handleBodyChange.bind(this)
    this.confirmBroadcast = this.confirmBroadcast.bind(this)
    this.toggleChange = this.toggleChange.bind(this)
  }

  render () {
    var divStyle = { display: 'flex', 'flexDirection': 'column', height: '100%' }

    return (
      <div className={'no-collapse'} style={divStyle}>
        <div style={{ flex: '1 1 auto' }}>
          <div className={'form-group'}>
            <label>
              <input type='checkbox'
                checked={this.state.isChecked}
                onChange={this.toggleChange} />&nbsp;
              Disappear after 15 Seconds
            </label>
          </div>
          <div className={'form-group'}>
            <label>Subject</label>
            <input type='text' className={'form-control'} value={this.state.subject} onChange={this.handleSubjectChange} />
          </div>
          <div className={'form-group'}>
            <label>Text</label>
            <textarea className={'form-control'} rows='12' value={this.state.text} onChange={this.handleBodyChange} />
          </div>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button className={'btn btn-primary float-right'} onClick={() => this.confirmBroadcast()}><i className={'fa fa-save'} />&nbsp;&nbsp;Send</button>
        </div>
      </div>
    )
  }

  handleSubjectChange (event) {
    this.setState({ subject: event.target.value })
  }

  handleBodyChange (event) {
    this.setState({ body: event.target.value })
  }

  toggleChange () {
    this.setState({ isChecked: !this.state.isChecked })
  }

  confirmBroadcast () {
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

const mapStateToProps = (state) => {
  return {}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  broadcastMessage: (message) => dispatch(globalsettingsActions.broadcastMessage(message))
})

const BroadcastComponent = wrapComponentWithProvider(reduxStore, Broadcast, mapStateToProps, mapDispatchToProps)
export default BroadcastComponent
