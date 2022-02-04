import React from 'react'
import { connect } from 'react-redux'
import PlanNavigationItem from './plan-navigation-item.jsx'
import cx from 'clsx'

// TODO: merge this with `foldout.jsx`?
const PlanNavigationList = ({ subnets = [], open = false }) => {
  return subnets.length > 0 ? (
    <ul className={cx('list', open && 'open')}>
      {subnets.map((subnet, index) =>
        <PlanNavigationItem key={index} subnet={subnet}/>
      )}
    </ul>
  ) : null
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigationList)






















// NOTE: Brian -- leave this for now...we'll delete it soon enough

// // FIXME: will draw {title} etc. not from props but state
// const PlanNavigationList = ({ title, locationAlerts, map }) => {

//   const alerts = Object.entries(locationAlerts)


// //   const [bounceMarker, setBounceMarker] = useState(null)

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

//       <div className="header">
//         <span className="svg plus-minus"></span>
//         <span className="svg warning"></span>
//         <h2>{title} <small>{alerts.length} item{alerts.length ? 's' : ''}</small></h2>
//       </div>

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
