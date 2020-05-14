import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import GlobalsettingsActions from '../global-settings/globalsettings-action'

export class ReleaseNotes extends Component {
  constructor (props) {
    super(props)
    
  }

  componentWillMount () {
    this.props.loadReleaseNotes()
  }

  render () {
    return !this.props.releaseNotes
      ? null
      : <div>
          {this.renderReleaseNotes()}
        </div>
  }

  renderReleaseNotes () {
    const releaseNote = this.props.releaseNotes
    return (
      <div>
        <table className="table table-sm table-striped">
          <tbody>
            {
              releaseNote.map((value,index)=>{  
                return <tr key={index}>
                  <td className="text-center">{value.version}</td>
                  <td> Version{value.version} </td>
                </tr>
              })
            }
          </tbody>
        </table>

        <div>
          <h1>Version {value.version}</h1>
          <p>{value.name}</p>
          </div>
      </div>
    )
  }
}


const mapStateToProps = (state) => ({
  releaseNotes: state.globalSettings.releaseNotes
})

const mapDispatchToProps = (dispatch) => ({
  loadReleaseNotes: () => dispatch(GlobalsettingsActions.loadReleaseNotes())
})

const ReleaseNotesComponent = wrapComponentWithProvider(reduxStore, ReleaseNotes, mapStateToProps, mapDispatchToProps)
export default ReleaseNotesComponent
