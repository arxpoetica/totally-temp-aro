import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import MapReportActions from './map-reports-actions'
import { REPORT_LAT_LONG_PRECISION } from './constants'

export class MapReportsListMapObjects extends Component {
  constructor (props) {
    super(props)
    this.pageIdToMapObject = {}
    this.pageIdToListeners = {}
    this.polygonOptions = {
      normal: {
        strokeColor: '#005cbf',
        strokeWeight: 1,
        fillColor: '#348ee8',
        fillOpacity: 0.2
      },
      selected: {
        strokeColor: '#005cbf',
        strokeWeight: 3,
        fillColor: '#348ee8',
        fillOpacity: 0.5
      }
    }
  }

  render () {
    return null // Everything in this component is about google maps objects. No UI.
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const newIds = new Set(this.props.reportPages.map(reportPage => reportPage.uuid))
    const oldIds = new Set(prevProps.reportPages.map(reportPage => reportPage.uuid))
    const pagesToCreate = this.props.reportPages.filter(reportPage => !oldIds.has(reportPage.uuid))
    const pagesToDelete = prevProps.reportPages.filter(reportPage => !newIds.has(reportPage.uuid))
    const pagesToUpdate = this.props.reportPages.filter(reportPage => newIds.has(reportPage.uuid) && oldIds.has(reportPage.uuid))

    pagesToCreate.forEach((reportPage, index) => this.createMapObject(reportPage, index))
    pagesToDelete.forEach(reportPage => this.deleteMapObject(reportPage.uuid))

    // INEFFICIENT: Only recreate if objects have actually changed:
    pagesToUpdate.forEach((reportPage, index) => {
      this.deleteMapObject(reportPage.uuid)
      this.createMapObject(reportPage, index)
    })
  }

  createMapObject (reportPage, index) {
    const polygonOptions = (index === this.props.activePageIndex) ? this.polygonOptions.selected : this.polygonOptions.normal
    const mapObject = new google.maps.Polygon({
      paths: this.getMapPolygonForReportPage(reportPage),
      strokeColor: polygonOptions.strokeColor,
      strokeWeight: polygonOptions.strokeWeight,
      fillColor: polygonOptions.fillColor,
      fillOpacity: polygonOptions.fillOpacity,
      clickable: true,
      draggable: true,
      map: this.props.googleMaps
    })
    var dragStartCoordinates = null
    const clickListener = mapObject.addListener('click', event => this.props.setActivePageIndex(index))
    const dragStartListener = mapObject.addListener('dragstart', event => { dragStartCoordinates = event.latLng })
    const dragEndListener = mapObject.addListener('dragend', event => {
      const dragEnd = event.latLng
      const deltaLat = dragEnd.lat() - dragStartCoordinates.lat()
      const deltaLng = dragEnd.lng() - dragStartCoordinates.lng()
      dragStartCoordinates = null
      var newPageDefinition = JSON.parse(JSON.stringify(this.props.reportPages[index]))
      newPageDefinition.mapCenter.latitude += deltaLat
      newPageDefinition.mapCenter.latitude = Math.round(newPageDefinition.mapCenter.latitude * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      newPageDefinition.mapCenter.longitude += deltaLng
      newPageDefinition.mapCenter.longitude = Math.round(newPageDefinition.mapCenter.longitude * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      this.props.savePageDefinition(index, newPageDefinition)
    })
    this.pageIdToListeners[reportPage.uuid] = [clickListener, dragStartListener, dragEndListener]
    this.pageIdToMapObject[reportPage.uuid] = mapObject
  }

  deleteMapObject (pageId) {
    this.pageIdToMapObject[pageId].setMap(null)
    delete this.pageIdToMapObject[pageId]
    this.pageIdToListeners[pageId].forEach(listener => google.maps.event.removeListener(listener))
    delete this.pageIdToListeners[pageId]
  }

  // Copy paste :( server side code
  getPaperSize (type) {
    // Note that all physical size definitions are in meters
    const a0Sizes = { x: 0.841, y: 1.189 }
    var paperSizeDefinitions = {}
    // Build sizes from A0 through A6
    var lastX = a0Sizes.y
    var lastY = a0Sizes.x * 2
    for (var i = 0; i <= 6; ++i) {
      const sizeX = lastY / 2
      const sizeY = lastX
      paperSizeDefinitions[`A${i}`] = { sizeX, sizeY }
      lastX = sizeX
      lastY = sizeY
    }
    return paperSizeDefinitions[type]
  }

  getMapPolygonForReportPage (reportPage) {
    const paperSizeMeters = this.getPaperSize(reportPage.paperSize)
    const sizeX = (reportPage.orientation === 'portrait') ? paperSizeMeters.sizeX : paperSizeMeters.sizeY
    const sizeY = (reportPage.orientation === 'portrait') ? paperSizeMeters.sizeY : paperSizeMeters.sizeX
    const physicalDistanceAlongLongitude = reportPage.worldLengthPerMeterOfPaper * sizeX
    const physicalDistanceAlongLatitude = reportPage.worldLengthPerMeterOfPaper * Math.cos(reportPage.mapCenter.latitude / 180.0 * Math.PI) * sizeY
    const equatorLength = 40075016.686  // meters
    const radiusEarth = equatorLength / 2.0 / Math.PI
    // const sliceLengthAtLongitude = equatorLength * Math.sin(reportPage.mapCenter.longitude)
    const latitudeDeltaBy2 = (physicalDistanceAlongLatitude / radiusEarth * 180.0 / Math.PI) / 2
    const longitudeDeltaBy2 = (physicalDistanceAlongLongitude / radiusEarth * 180.0 / Math.PI) / 2

    var paths = []
    paths.push({ lat: reportPage.mapCenter.latitude - latitudeDeltaBy2, lng: reportPage.mapCenter.longitude - longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude + latitudeDeltaBy2, lng: reportPage.mapCenter.longitude - longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude + latitudeDeltaBy2, lng: reportPage.mapCenter.longitude + longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude - latitudeDeltaBy2, lng: reportPage.mapCenter.longitude + longitudeDeltaBy2 })
    return paths
  }
}

MapReportsListMapObjects.propTypes = {
  activePageIndex: PropTypes.number,
  googleMaps: PropTypes.object,
  reportPages: PropTypes.array
}

const mapStateToProps = state => ({
  activePageIndex: state.mapReports.activePageIndex,
  googleMaps: state.map.googleMaps,
  reportPages: state.mapReports.pages
})

const mapDispatchToProps = dispatch => ({
  savePageDefinition: (index, pageDefinition) => dispatch(MapReportActions.savePageDefinition(index, pageDefinition)),
  setActivePageIndex: index => dispatch(MapReportActions.setActivePageIndex(index))
})

const MapReportsListMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(MapReportsListMapObjects)
export default MapReportsListMapObjectsComponent
