import React from "react";

function ModalBreadCrumb(props) {
  const isLastCrumb = (index) => {
    return props.breadCrumb.length - 1 === index
  }

  return (
      <div style={{ display: "flex", fontSize: "16px" }}>
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
      </div>
  );
}
export default ModalBreadCrumb;