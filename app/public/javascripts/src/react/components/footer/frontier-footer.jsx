import React from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export const FrontierFooter = ({ configuration }) => {

  return (
    <footer>
      <div style={{ height: '25px', width: '100%', fontSize: '12px', position: 'fixed', bottom: '0px' }}>
        <table width="100%" style={{ backgroundColor: `${configuration.toolbar.toolBarColor}` }}>
          <tbody>
            <tr>
              <td>
                <b className="npm-details" style= {{ marginLeft: '1%', color: '#FFFFFF', position: 'relative', bottom: '-2px' }}>
                  <span className="powered" style={{ fontSize: '8px' }}>Powered by</span>
                  <span className="npm" style={{ fontSize: '14px' }}>
                    <a href="http://npmeco.corp.pvt" target="_blank" style={{ textDecoration: 'none', color: '#FFFFFF' }}>NPM</a>
                  </span>
                  <span className="copyright" style={{ fontSize: '8px' }}>&copy; 2018</span>
                  <span className="system" style={{ paddingLeft: '15%' }}>NPM BSA System</span>
                  <span className="version" style={{ fontSize: '9px', marginLeft: '1%' }}>version 4</span>
                  <span className="issues" style={{ paddingLeft: '20%' }}>
                    <a href="http://npmintake.corp.pvt" target="_blank" style={{ textDecoration: 'none', color: '#FFFFFF' }}>Issues</a>
                  </span>
                  <span className="training" style={{ marginLeft: '4%' }}>
                    <a href="https://wiki.ftr.com/display/NPMGMT/BSA+Documentation" target="_blank" style={{ textDecoration: 'none', color: '#FFFFFF' }}>Documentation</a>
                  </span>
                  <span className="contact" style={{ marginLeft: '4%' }}>
                      <a href="mailto: BSA.Inquiry@ftr.com?body=Please%20Include%3A%0A-Wirecenter:%0A-Issue:%0A" target="_blank" style={{ textDecoration: 'none', color: '#FFFFFF' }}>Contact Us</a>
                  </span>
                </b>
              </td>

              <td align="right"></td>
              <td>
                <span id="ftr_logo">
                  <a href="http://home.ftr.com" target="_blank">
                    <img src="/images/assets/2016_frontier-white.ashx" alt="Frontier Communications" style={{ height: '20px' }} />
                  </a>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </footer>
  )
}

const mapStateToProps = (state) => ({
  configuration: state.toolbar.appConfiguration,
})

export default wrapComponentWithProvider(reduxStore, FrontierFooter, mapStateToProps, null)
