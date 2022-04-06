import React from 'react'

/**
 * State icon with different icons representing state
 * @param {number} state
 * @param {number} onClick
 */

export const StateIcon = ({ state = 'good', size, onClick }) => <>
  <div
    className={`state-icon ${state}`}
    onClick={event => onClick && onClick(event)}
  />

  {/* static styles */}
  <style jsx>{`
    @keyframes state-icon-spin {
      from { transform:rotate(0deg); }
      to { transform:rotate(360deg); }
    }
    .state-icon {
      height: 30px;
      background: none no-repeat center transparent;
    }
    .warn { background-image: url('/svg/icon-warn.svg'); }
    .error { background-image: url('/svg/icon-error.svg'); }
    .good { background-image: url('/svg/icon-good.svg'); }
    .loading {
      background-image: url('/svg/icon-loader.svg');
      animation: state-icon-spin 1500ms infinite linear;
    }
  `}</style>
  {/* dynamic styles */}
  <style jsx>{`
    .state-icon {
      width: ${size === 'sm' ? '22px' : '30px'};
      background-size: ${size === 'sm' ? '67%' : '60%'};
      cursor: ${onClick ? 'pointer' : 'default'};
    }
  `}</style>
</>
