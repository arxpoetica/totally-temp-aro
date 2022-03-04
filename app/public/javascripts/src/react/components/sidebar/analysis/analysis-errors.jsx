import React from 'react'
import { connect } from 'react-redux'
import ToolTip from '../../common/tooltip.jsx'

const AnalysisErrors = (props) => {
    const hasErrors = Object.values(props.planErrors).some(errorCategory => {
        return Object.values(errorCategory).length > 0;
    })
    const errorHeaders = {
        CANCELLED: {
            header: "Cancelled"
        },
        PRE_VALIDATION: {
            header: "Pre Validation",
            location: "Max Location Failure",
            edge: "Max Edge Failure",
            replacements: [
                "database "
            ]
        },
        ROOT_OPTIMIZATION_FAILURE: {
            header: "Optimzation Failure"
        },
        RUNTIME_EXCEPTION: {
            header: "Runtime",
            UNKNOWN: "Unknown Failure",
            replacements: [
                ": null"
            ]
        }
    }

    const generateMessage = (errorCategory, serviceCode) => {
        let baseErrorMessage;
        let errorMessage;

        errorMessage = baseErrorMessage =
            props.planErrors[errorCategory][serviceCode].split(
                ":: "
            )[1]
            
            if(errorHeaders[errorCategory].replacements) {
                errorHeaders[errorCategory].replacements.forEach((word) => {
                    errorMessage = baseErrorMessage = errorMessage.replace(word, "")
                })
            }


            Object.keys(errorHeaders[errorCategory]).forEach(keyword => {
                if (props.planErrors[errorCategory][serviceCode].includes(keyword)) {
                    errorMessage = errorHeaders[errorCategory][keyword];
                }
            })

        return [errorMessage, baseErrorMessage]
    }

    return (
        <div>
            {hasErrors && <h2>Failures</h2>}
            <div style={{display: "flex", flexWrap: "wrap" }}>                
                {hasErrors && Object.keys(props.planErrors).map((errorCategory) => {
                    return Object.keys(props.planErrors[errorCategory]).map((serviceCode, i) => {
                        let [errorMessage, baseErrorMessage] =
                            generateMessage(errorCategory, serviceCode);

                        const errorBody = (
                            <div style={{ justifyContent: "space-between", display: "flex", width: "100%" }}>
                                <div style={{ maxWidth: "50%" }}>
                                    <ToolTip
                                        isActive={errorMessage !== baseErrorMessage}
                                        toolTipText={baseErrorMessage}
                                        minWidth="200%"
                                    >
                                        <div style={{ fontStyle: "italic" }}>
                                            {errorMessage}
                                        </div>
                                    </ToolTip>                                </div>
                                <div>
                                    Service Area: {serviceCode}
                                </div>
                            </div>
                        )
                        
                        if (i === 0) {
                            return (
                                <React.Fragment key={serviceCode}>
                                    <div style={{ fontWeight: "bold", width: "100%" }}>
                                        {errorHeaders[errorCategory].header + " Errors"}
                                    </div>
                                    {errorBody}
                                </React.Fragment>
                            )
                        } else {
                            return (
                                <React.Fragment key={serviceCode}>
                                    {errorBody}
                                </React.Fragment>
                            )
                        }
                    })
                })}
            </div>
        </div>
    )
}

const mapStateToProps = (state) => ({
    planErrors: state.plan.activePlan.planErrors
})

export default connect(mapStateToProps, null)(AnalysisErrors)