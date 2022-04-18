import React, { Component } from 'react'
import moment from "moment"
import { connect } from 'react-redux'
import UiActions from '../configuration/ui/ui-actions'
import { momentStartDate, momentEndDate } from '../../common/view-utils.js'
export class Broadcast extends Component {
  constructor(props) {
    super(props)
    const { subject, message, startDate, endDate } = { ...this.props.broadcast }
    this.state = {
      subject: subject || '',
      message: message || '',
      startDate: startDate || '',
      endDate: endDate || '',
    }
  }

  render() {
    const { subject, message, startDate, endDate } = this.state
    return (
      <div className="no-collapse" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: '1 1 auto' }}>
          <div className="form-group">
            <label className="font-weight-bold">Subject</label>
            <input
              name="subject"
              type="text"
              className="form-control"
              value={subject}
              onChange={(event) => this.handleOnChange(event)}
            />
          </div>
          <div className="form-group">
            <label className="font-weight-bold">Message</label>
            <textarea
              name="message"
              className="form-control"
              rows="9"
              value={message}
              onChange={(event) => this.handleOnChange(event)}
            />
          </div>
          <div className="form-group">
            <label className="font-weight-bold">When should the messages broadcast?</label>
            <div className="row">
              <div className="col-md-5">
                <input
                  type="date"
                  name="startDate"
                  className="form-control"
                  value={startDate}
                  onChange={(event) => this.handleOnChange(event)}
                />
              </div>
              <div className="col-md-1 pt-2 text-center">
                to
              </div>
              <div className="col-md-5">
                <input
                  type="date"
                  name="endDate"
                  className="form-control"
                  value={endDate}
                  onChange={(event) => this.handleOnChange(event)}
                />
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button
            type="button"
            disabled={!this.enableSave()}
            className="btn btn-primary float-right"
            onClick={() => this.saveBroadcast()}
          >
            <i className="fa fa-save" />
            &nbsp;&nbsp;Save
          </button>
        </div>
      </div>
    )
  }

  enableSave() {
    const { subject, message, startDate, endDate } = this.state
    return subject && message && startDate && endDate
  }

  handleOnChange(event) {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  saveBroadcast() {
    const { startDate, endDate } = this.state
    const compareStart = momentStartDate(startDate)
    const compareEnd = momentEndDate(endDate)

    compareStart <= compareEnd
      ? this.props.saveConfigurationToServerAndReload('broadcast', this.state) // To update config in ui.settings and reload it.
      : swal({
        title: 'Invalid date range',
        text: 'Please select a valid date range for broadcast',
        type: 'warning'
      })
  }
}

const mapStateToProps = (state) => ({
  broadcast: state.configuration.ui.items.broadcast,
})

const mapDispatchToProps = (dispatch) => ({
  saveConfigurationToServerAndReload: (type, configuration) => dispatch(
    UiActions.saveConfigurationToServerAndReload(type, configuration)
  ),
})

export default connect(mapStateToProps, mapDispatchToProps)(Broadcast)
