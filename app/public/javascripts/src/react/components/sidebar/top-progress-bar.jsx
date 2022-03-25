import React from 'react'
import { connect } from 'react-redux'

const TopProgressBar = (props) => {
    let progress = 0;
    switch (props.activePlan.planType) {
        case "UNDEFINED":
            progress = props.analysisType === "COVERAGE_ANALYSIS"
                ? props.coverageProgress
                : props.networkProgress;
            break;
        case "RFP":
            progress = props.rfpProgress;
            break;
        case  "RING":
            progress = props.ringProgress;
            break;
        default:
            progress = props.networkProgress;
            break;
    }

    return (
    <div
        style={{
            height: '34px',
            width: '100%',
            display: 'flex',
            position: 'relative',
            marginBottom: '10px'
        }}
    >
        <div style={{ flex: '1 1 auto' }}>
            <div
                className='progress'
                style={{height: '50%', background: "#fff", border: "1px solid #e9ecef" }}
            >
                <div
                    className='progress-bar progress-bar-optimization'
                    role='progressbar'
                    aria-valuenow={progress}
                    aria-valuemin='0'
                    aria-valuemax='1'
                    style={{ lineHeight: '34px', width: (progress * 100) + '%' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '25%',
                        left: '50%',
                        color: 'black',
                        transform: 'translateX(-50%) translateY(-50%)',
                        width: '80px',
                        textAlign: 'center',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                    }}
                >
                    {Math.round(progress * 100) + '%'}
                </div>
            </div>
        </div>
    </div>
    )
}

const mapStateToProps = (state) => ({
    ringProgress: state.ringEdit.analysis.progress,
    rfpProgress: state.optimization.rfp.progress,
    networkProgress: state.ringEdit.analysis.progress,
    coverageProgress: state.coverage.progress,
    activePlan: state.plan.activePlan,
    analysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type
})

export default connect(mapStateToProps, null)(TopProgressBar)