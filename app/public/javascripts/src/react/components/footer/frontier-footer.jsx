import React from 'react'
import { connect } from 'react-redux'

const FrontierFooter = ({ configuration }) => {
  return (
    configuration.ARO_CLIENT === 'frontier'
    && <>

      <footer>
        <div className="group">
          Powered by
          <a href="http://npmeco.corp.pvt" target="_blank" className="npm">NPM</a>
          &copy; 2018
        </div>
        <div className="group">
            <span className="npm">NPM BSA System</span>
            version 4
        </div>
        <nav>
          <a href="http://npmintake.corp.pvt" target="_blank">Issues</a>
          <a href="https://wiki.ftr.com/display/NPMGMT/BSA+Documentation" target="_blank">Documentation</a>
          <a href="mailto: BSA.Inquiry@ftr.com?body=Please%20Include%3A%0A-Wirecenter:%0A-Issue:%0A" target="_blank">Contact Us</a>
        </nav>
        <a href="http://home.ftr.com" target="_blank">
          <svg width="89" height="21" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M68.652.185h9.75c5.519 0 10 4.481 10 10 0 5.52-4.481 10-10 10-4.996 0-9.141-3.672-9.882-8.462a.25.25 0 0 1 .248-.288h1.926c.179 0 .333.125.37.3a7.507 7.507 0 0 0 7.338 5.95c4.14 0 7.5-3.36 7.5-7.5 0-4.14-3.36-7.5-7.5-7.5h-9.75a.249.249 0 0 1-.25-.25v-2a.25.25 0 0 1 .25-.25z"/>
            <path d="M76.902 6.435h-8.25a.25.25 0 0 1-.25-.25v-2a.25.25 0 0 1 .25-.25h8.25a.25.25 0 0 1 .25.25v2a.25.25 0 0 1-.25.25zM68.475 10.112a.25.25 0 0 0 .177.073h4.506a.252.252 0 0 0 .25-.25v-2a.25.25 0 0 0-.25-.25h-4.506a.25.25 0 0 0-.25.25v2c0 .066.026.13.073.177zM86.76 2.003h.002L86.764 2 86.766 2a.016.016 0 0 0 .002-.004V.674l.632.81a.021.021 0 0 0 .007.006.02.02 0 0 0 .01.001h.04a.018.018 0 0 0 .016-.008L88.1.68V1.99c0 .004 0 .007.003.01a.014.014 0 0 0 .009.004h.28l.003-.001A.011.011 0 0 0 88.398 2a.011.011 0 0 0 .003-.005V.193A.011.011 0 0 0 88.4.19a.011.011 0 0 0-.005-.003h-.002L88.39.184h-.259c-.003 0-.006 0-.008.002a.02.02 0 0 0-.008.006l-.678.888-.679-.888a.022.022 0 0 0-.016-.008h-.256a.014.014 0 0 0-.014.014V1.99c0 .004.001.007.004.01a.014.014 0 0 0 .01.004h.275zM85.303 1.997V.462h-.587L84.714.46 84.71.459a.011.011 0 0 1-.004-.01V.206c0-.003.002-.007.004-.01a.014.014 0 0 1 .01-.003h1.47c.004 0 .007.001.01.004a.014.014 0 0 1 .004.01V.45l-.001.005a.012.012 0 0 1-.008.007h-.592V2.002a.011.011 0 0 1-.003.005.012.012 0 0 1-.004.003h-.28a.013.013 0 0 1-.01-.003.013.013 0 0 1-.004-.01z"/>
            <path d="M18.022 7.023c0-2.534 2.073-4.588 4.63-4.588 2.558 0 4.632 2.054 4.632 4.588 0 2.535-2.074 4.59-4.631 4.59-2.558 0-4.631-2.055-4.631-4.59zm1.28 0c0 1.84 1.5 3.33 3.35 3.33 1.851 0 3.352-1.49 3.352-3.33 0-1.838-1.5-3.328-3.351-3.328s-3.351 1.49-3.351 3.328zM65.941 4.9a2.515 2.515 0 0 1-2.092 2.716l1.476 2.554h.522v1.259h-.66c-.365 0-.701-.195-.883-.51l-1.886-3.266h-3.041v3.776h-1.303V2.623h.005l-.005-.005h5.305c1.31 0 2.443.978 2.562 2.283zm-6.564-1.023v2.518h4.057a1.258 1.258 0 1 0 0-2.518h-4.057z"/>
            <path d="M48.485 11.429h-1.303V2.623h1.303v8.806zM56.876 3.877V2.618l-7.043.005v8.806h7.043V10.17h-5.74V7.653h5.391V6.394h-5.39V3.877h5.74zM7.907 3.877V2.618L.75 2.623v8.806h1.303V7.653h5.165V6.394H2.053V3.877h5.854zM35.559 9.686V2.623h1.303v8.806h-1.118c-.364 0-.7-.195-.882-.51l-4.064-7.037h-1.012v7.547h-1.302V2.623h2.639c.249 0 .479.133.603.349l3.833 6.714zM46.015 2.618l-7.986.005v1.254h3.341v7.552h1.303V3.877h3.342V2.618z"/>
            <path d="M15.07 7.616A2.515 2.515 0 0 0 17.16 4.9c-.118-1.305-1.252-2.283-2.562-2.283H9.295l.005.005h-.005v8.806h1.303V7.653h3.041l1.886 3.266c.182.315.518.51.883.51h.66V10.17h-.522L15.07 7.616zm-4.473-1.221V3.877h4.058a1.258 1.258 0 1 1 0 2.518h-4.058z"/>
          </svg>
        </a>
      </footer>

      <style jsx>{`
        :global(:root) { --custom-footer-height: 25px; }
        :global(#left-col-wrapper) { bottom: var(--custom-footer-height); }
        footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          height: var(--custom-footer-height);
          padding: 0 15px;
          background-color: ${configuration.toolbar.toolBarColor};
          color: #ffffff;
          font: bolder 12px/1 'Exo', sans-serif;
        }
        a {
          text-decoration: none;
          color: #ffffff;
        }
        .group {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 9px;
        }
        .npm { font-size: 13px; }
        nav {
          display: flex;
          gap: 50px;
        }
      `}</style>
    </>
  )
}

const mapStateToProps = (state) => ({
  configuration: state.toolbar.appConfiguration,
})

export default connect(mapStateToProps, null)(FrontierFooter)
