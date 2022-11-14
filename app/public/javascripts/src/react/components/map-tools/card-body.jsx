import React from 'react'

export const CardBody = (props) => {
  const { showCardBody, children, padding } = props

  return (
    <>
      {showCardBody &&
        (<div className="card-body">
          {children}
          <style jsx>{`
            .card-body {
              padding: ${padding || '0.75rem'};
              max-height: calc(100vh - 260px);
              overflow-y: auto;
              overflow-x: hidden;
            }
          `}</style>
        </div>) 
      }
    </>
  )
}
