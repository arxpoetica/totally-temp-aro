import React, { useState } from "react";

function ToolTip(props) {
    const [hover, setHover] = useState(false);

    return (
        <div style={{position: "relative"}}>
            <div
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {props.children}
            </div>
            {props.isActive && (
                <div
                    className="react-tool-tip"
                    style={{ visibility: hover ? "visible" : "hidden" }}
                >
                    {props.toolTipText}
                </div>
            )}
        </div>
    );
}
export default ToolTip;
