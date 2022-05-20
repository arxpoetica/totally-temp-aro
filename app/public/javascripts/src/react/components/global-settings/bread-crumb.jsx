import React from "react";

function ModalBreadCrumb(props) {
  const isLastCrumb = (index) => {
    return props.breadCrumb.length - 1 === index
  }

  return (
      <div className="crumb-wrapper">
        {props.breadCrumb.map((crumb, i) => {
          return (
            <div
              key={crumb}
              style={{
                color: isLastCrumb(i) ? 'black' : 'grey',
                fontWeight: isLastCrumb(i) ? 'bold' : 'normal',
                marginRight: isLastCrumb(i) ? '0' : '2px'
              }}
            >
              {crumb} {!isLastCrumb(i) && " >"}
            </div>
          )
        })}
        <style jsx>{`
          .crumb-wrapper {
            display: flex;
            font-size: 16px;
          }
        `}</style>
      </div>
  );
}
export default ModalBreadCrumb;