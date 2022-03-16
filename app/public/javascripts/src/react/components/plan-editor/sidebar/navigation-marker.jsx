import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { constants } from '../shared'
const { Z_INDEX_PIN } = constants

const NavigationMarker = ({ isHover, position, map }) => {

  const [bounceMarker, setBounceMarker] = useState(null)

  useEffect(() => {
    isHover ? handleMouseEnter() : handleMouseLeave()
    return () => handleMouseLeave() // safety first
  }, [isHover])

  const handleMouseEnter = () => {
    const marker = new google.maps.Marker({
      map,
      icon: {
        url: '/svg/map-icons/pin.svg',
        size: new google.maps.Size(19, 30),
      },
      animation: google.maps.Animation.BOUNCE,
      position,
      zIndex: Z_INDEX_PIN,
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })
    setBounceMarker(marker)
  }

  const handleMouseLeave = () => {
    if (bounceMarker) {
      bounceMarker.setMap(null)
      setBounceMarker(null)
    }
  }

  // not rendering anything
  return null
}

const mapStateToProps = state => ({ map: state.map.googleMaps })
export default connect(mapStateToProps, null)(NavigationMarker)
