import React, { useState, useRef, useEffect } from "react";
import "./tooltip.css"

function ToolTip(props) {
    const angularChild = useRef(null)
    const [hover, setHover] = useState(false);
    useEffect(() => {
        angularChild.current.innerHTML = props.angularChildren
    }, [props.angularChildren])
    return (
        <div
            style={{position: "relative"}}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
        >
            <div>
                {props.children || <div onClick={() => props.clickChild(undefined, props.angularComponent)} ref={angularChild}/>}
            </div>
            {props.isActive && (
                <>
                    <div
                        className="react-tool-tip"
                        style={{
                            display: hover ? "block" : "none"
                        }}
                    >
                        {props.toolTipText}
                    </div>
                    <div 
                        style={{
                            display: hover ? "block" : "none"
                        }}
                        className="react-tool-tip-border-arrow"
                    />
                </>
            )}
        </div>
    );
}
export default ToolTip;
