import React from 'react'

export const CardBody = (props) => {
  const { showCardBody, children } = props

  return (
    <>
      {showCardBody &&
        (<div className="card-body">
          {children}
          <style jsx>{`
            .card-body {
              padding: 0.75rem;
              max-height: 600px;
              overflow-y: auto;
              overflow-x: hidden;
            }
          `}</style>
        </div>) 
      }
    </>
  )
}
