import React from 'react'
import { Component } from 'react'
import { PropTypes } from 'prop-types'

export default class CoverageInitializer extends Component {
  render() {
    return <div>
      <p>Hello world</p>
      <p>Property1: {this.props.property1}</p>
    </div>
  }
}

CoverageInitializer.propTypes = {
  property1: PropTypes.string
}
