import React from "react";
import { Button } from "@mantine/core"

function ModalBreadCrumb(props) {
  const isLastCrumb = (index) => {
    return props.breadCrumb.length - 1 === index
  }

  return (
      <div className="crumb-wrapper">
        { props.breadCrumb.length > 1 && 
          <Button style={{ marginRight: "2%" }} color="primary" onClick={props.back}>
            Back
          </Button>
        }
        {props.breadCrumb.map((crumb, i) => {
          return (
            <div
              key={crumb + i}
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
            align-items: baseline;
            white-space: nowrap;
          }
        `}</style>
      </div>
  );
}
export default ModalBreadCrumb;