import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'

/**
 * A customized `CustomOverlayView` on the map
 * SEE: https://dev.to/rihdusr/render-a-react-component-in-google-map-171o
 */
class CustomOverlayView extends google.maps.OverlayView {
  position = null
  content = null
  constructor(props) {
    super(props)
    props.position && (this.position = props.position)
    props.content && (this.content = props.content)
  }
  // called when the popup is added to the map
  onAdd() {
    this.getPanes().floatPane.appendChild(this.content)
  }
  // called when the popup is removed from the map
  onRemove() {
    if (this.content.parentElement) {
        this.content.parentElement.removeChild(this.content)
    }
  }
  // called each frame when the popup needs to draw itself
  draw() {
    const { x, y } = this.getProjection().fromLatLngToDivPixel(this.position)
    this.content.style.left = x + 'px'
    this.content.style.top = y + 'px'
  }
}

function createOverlayElement() {
  const div = document.createElement('div')
  div.classList.add('map-overlay-view')
  return div
}

const _OverlayView = ({ map, position, children }) => {

  let overlay
  useEffect(() => {
    // remove overlay from the map
    return () => {
        if (overlay) {
          overlay.setMap(null)
          overlay = null
        }
    }
  }, [])

  // guard
  if (!map) return null

  const elem = useRef(createOverlayElement())
  overlay = new CustomOverlayView({ position, content: elem.current })
  overlay.setMap(map)
  return ReactDOM.createPortal(children, elem.current)
}

const mapStateToProps = state => ({
  // TODO: why is this named `googleMaps`? Is it ever plural? Isn't it a single map?
  map: state.map.googleMaps,
})
const mapDispatchToProps = dispatch => ({})
export const OverlayView = connect(mapStateToProps, mapDispatchToProps)(_OverlayView)
