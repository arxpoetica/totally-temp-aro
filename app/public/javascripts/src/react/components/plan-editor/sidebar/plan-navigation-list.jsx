import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanNavigationItem from './plan-navigation-item.jsx'
import PlanEditorSelectors from '../plan-editor-selectors'
import { constants } from '../shared'
import cx from 'clsx'
const { ALERT_TYPES, Z_INDEX_PIN } = constants

// FIXME: will draw {title} etc. not from props but state
const PlanNavigationList = ({ subnet, title, depth = 0 }) => {

  const [open, setOpen] = useState(true)

  return (
    <ul className={cx('list', open && 'open')}>
      {/* <li>{JSON.stringify(subnet)}</li> */}
      <PlanNavigationItem title={`Depth ${depth + 1}`} depth={depth}/>
    </ul>
  )
}

const mapStateToProps = state => ({
  subnets: state.planEditor.subnets,
  // locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  // map: state.map.googleMaps,
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigationList)
























// // FIXME: will draw {title} etc. not from props but state
// const PlanNavigationList = ({ title, locationAlerts, map }) => {

//   const alerts = Object.entries(locationAlerts)

//   const [open, setOpen] = useState(false)
// //   const [bounceMarker, setBounceMarker] = useState(null)
//   const handleOpenState = () => setOpen(!open)

//   const handleMouseEnter = ({ latitude, longitude }) => {
//     // const marker = new google.maps.Marker({
//     //   map,
//     //   icon: {
//     //     url: '/svg/map-icons/pin.svg',
//     //     size: new google.maps.Size(19, 30),
//     //   },
//     //   animation: google.maps.Animation.BOUNCE,
//     //   position: { lat: latitude, lng: longitude },
//     //   zIndex: Z_INDEX_PIN,
//     //   optimized: !ARO_GLOBALS.MABL_TESTING,
//     // })
//     // setBounceMarker(marker)
//   }

//   const handleMouseLeave = () => {
//     // bounceMarker.setMap(null)
//     // setBounceMarker(null)
//   }

//   const handleClick = ({ latitude, longitude }) => {
//     // map.setCenter({ lat: latitude, lng: longitude })
//   }

//   return (
//     <div className={cx('plan-navigation-list', open && 'open')}>

//       <div className="header" onClick={handleOpenState}>
//         <span className="svg plus-minus"></span>
//         <span className="svg warning"></span>
//         <h2>{title} <small>{alerts.length} item{alerts.length ? 's' : ''}</small></h2>
//       </div>

//       <PlanNavigationList title="One"/>
//       <PlanNavigationList title="Two"/>

//       {/* <ul className={cx('content', open && 'open')}>
//         {alerts.map(([id, location]) => (
//           location.alerts.map((alert, index) =>
//             <li
//               key={index}
//               onMouseEnter={() => handleMouseEnter(location.point)}
//               onMouseLeave={() => handleMouseLeave()}
//               onClick={() => handleClick(location.point)}
//             >
//               <div className="text">
//                 <div
//                   className="svg location"
//                   style={ { backgroundImage: `url('${ALERT_TYPES[alert].iconUrl}')` } }
//                 ></div>
//                 {ALERT_TYPES[alert].displayName}
//               </div>
//             </li>
//           )
//         ))}
//       </ul> */}

//     </div>
//   )

// }
