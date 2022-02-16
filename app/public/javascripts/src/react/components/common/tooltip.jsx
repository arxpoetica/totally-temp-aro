import React, { useState } from "react";
import "./tooltip.css"

function ToolTip(props) {
    const [hover, setHover] = useState(false);
    return (
        <div
            style={{position: "relative"}}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
        >
            {props.children}
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
