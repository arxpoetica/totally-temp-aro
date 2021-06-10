import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'
import AroHttp from '../../common/aro-http'

export class ReleaseNotes extends Component {
  constructor (props) {
    super(props)
    this.state = {
      versionDetails: null,
      showVersion: false
    }
    
  }

  componentWillMount () {
    this.props.loadReleaseNotes()
  }

  componentWillUnmount () {
    this.props.setCurrentViewToReleaseNotes('')
  }

  onClickVersion(id){
    AroHttp.get(`/reports/releaseNotes/${id}`)
      .then(result => {
        this.setState({versionDetails:result.data,showVersion:true})
      })
      .catch(err => console.error(err))
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
      releaseNote.length === 0
      ? <div className="alert alert-info" role="alert">
          There is no information avilable for Release Notes.
        </div>
      : !this.state.showVersion?
      <div>
        <table className="table table-sm table-striped">
          <tbody>
            {
              releaseNote.map((value,index)=>{  
                return <tr key={index} onClick={()=>this.onClickVersion(value.id)}>
                  <td className="text-center">{value.version}</td>
                  <td> Version{value.version} </td>
                </tr>
              })
            }
          </tbody>
        </table>
      </div>
      :
      <div>
        <h1>Version {this.state.versionDetails.version}</h1>
        <div dangerouslySetInnerHTML={{ 
            __html: this.state.versionDetails.description
          }}
        ></div>
      </div>
    )
  }
}


const mapStateToProps = (state) => ({
  releaseNotes: state.globalSettings.releaseNotes
})

const mapDispatchToProps = (dispatch) => ({
  loadReleaseNotes: () => dispatch(globalsettingsActions.loadReleaseNotes()),
  setCurrentViewToReleaseNotes: (viewString) => dispatch(globalsettingsActions.setCurrentViewToReleaseNotes(viewString)),
})

const ReleaseNotesComponent = wrapComponentWithProvider(reduxStore, ReleaseNotes, mapStateToProps, mapDispatchToProps)
export default ReleaseNotesComponent
