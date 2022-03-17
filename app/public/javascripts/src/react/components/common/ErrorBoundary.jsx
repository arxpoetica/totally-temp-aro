import React, { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    // It will update the state so the next render shows the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // It will catch error in any component below. We can also log the error to an error reporting service.
  }

  render() {
    if (this.state.hasError) { return <></> }
    return this.props.children
  }
}

export default ErrorBoundary
