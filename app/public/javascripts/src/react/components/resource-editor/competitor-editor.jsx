import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class CompetitorEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  componentWillMount () {
  }

  render () {
    return <div><h4>Create Competitor-editor </h4></div>
  }

  // renderCompetitorEditor()  {
  //   return (
  //      <>
  //       <h4>Create Competitor-editor </h4>
  //     </>
  //   )
  // }
}

  const mapStateToProps = (state) => ({
  })   

  const mapDispatchToProps = (dispatch) => ({
   
  })

const CompetitorEditorComponent = connect(mapStateToProps, mapDispatchToProps)(CompetitorEditor)
export default CompetitorEditorComponent