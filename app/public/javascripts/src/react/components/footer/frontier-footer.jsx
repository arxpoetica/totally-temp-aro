import React from 'react'
import { connect } from 'react-redux'

const FrontierFooter = ({ configuration }) => {
  return (
    configuration.ARO_CLIENT === 'frontier'
    && (
      <footer>
        <div className="footer-continer">
          <table width="100%" style={{ backgroundColor: `${configuration.toolbar.toolBarColor}` }}>
            <tbody>
              <tr>
                <td>
                  <b className="npm-details">
                    <span className="powered">Powered by</span>
                    <span className="npm">
                      <a href="http://npmeco.corp.pvt" target="_blank">NPM</a>
                    </span>
                    <span className="copyright">&copy; 2018</span>
                    <span className="system">NPM BSA System</span>
                    <span className="version">version 4</span>
                    <span className="issues">
                      <a href="http://npmintake.corp.pvt" target="_blank">Issues</a>
                    </span>
                    <span className="training">
                      <a href="https://wiki.ftr.com/display/NPMGMT/BSA+Documentation" target="_blank">Documentation</a>
                    </span>
                    <span className="contact">
                      <a href="mailto: BSA.Inquiry@ftr.com?body=Please%20Include%3A%0A-Wirecenter:%0A-Issue:%0A" target="_blank">Contact Us</a>
                    </span>
                  </b>
                </td>
                <td align="right" />
                <td>
                  <span id="ftr_logo">
                    <a href="http://home.ftr.com" target="_blank">
                      <img src="/images/assets/2016_frontier-white.ashx" alt="Frontier Communications" />
                    </a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </footer>
    )
  )
}

const mapStateToProps = (state) => ({
  configuration: state.toolbar.appConfiguration,
})

export default connect(mapStateToProps, null)(FrontierFooter)
