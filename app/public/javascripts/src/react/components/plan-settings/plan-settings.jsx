import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './plan-settings.css';
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap';
import PlanResourceSelection from './plan-resource-selection/plan-resource-selection.jsx'
import PlanDataSelection from './plan-data-selection/plan-data-selection.jsx'


export class PlanSettings extends Component {
  constructor (props) {
    super(props)
    this.state = {
      collapseCards: 'DATA_SELECTION'
    }
  }

  render () {
    return this.renderPlanSettings()
  }

  renderPlanSettings() {

    const {collapseCards} = this.state;

    return (
      <div className="plan-settings-container">
  
        {/* Buttons to commit or discard a transaction */}
        <div className="text-center">
          <div className="btn-group ">
            <button className="btn btn-light mr-1"><i className="fa fa-check-circle"></i>&nbsp;&nbsp;Commit</button>
            <button className="btn btn-light"><i className="fa fa-times-circle"></i>&nbsp;&nbsp;Discard</button>
          </div>
          <div className="plan-settings-error-contain"> 
            <div className="alert-danger plan-settings-error-message"></div> 
          </div>
        </div>

        <Card className={`card-collapse ${collapseCards === 'DATA_SELECTION' ? 'collapse-show' :''}`}>
          <CardHeader className={`card-header-dark ${collapseCards === 'DATA_SELECTION' ? 'card-fixed' :''}`} onClick={(e)=>this.toggleCards(e)} data-event='DATA_SELECTION'>Data Selection</CardHeader>
          <Collapse isOpen={collapseCards === 'DATA_SELECTION'}>
            <CardBody style={{padding:'0px', marginTop: '40px'}}>
              <PlanDataSelection/>
            </CardBody>
          </Collapse>
        </Card>

        <Card className={`card-collapse ${collapseCards === 'RESOURCE_SELECTION' ? 'collapse-show' :''}`}>
          <CardHeader className={`card-header-dark ${collapseCards === 'RESOURCE_SELECTION' ? 'card-fixed' :''}`} onClick={(e)=>this.toggleCards(e)} data-event='RESOURCE_SELECTION'>Resource Selection</CardHeader>
          <Collapse isOpen={collapseCards === 'RESOURCE_SELECTION'}>
            <CardBody style={{padding:'0px', marginTop: '40px'}}>
              <PlanResourceSelection/>
            </CardBody>
          </Collapse>
        </Card>

        <Card className={`card-collapse ${collapseCards === 'PROJECT_CONFIGURATION' ? 'collapse-show' :''}`}>
          <CardHeader className="card-header-dark" onClick={(e)=>this.toggleCards(e)} data-event='PROJECT_CONFIGURATION'>Project Configuration</CardHeader>
          <Collapse isOpen={collapseCards === 'PROJECT_CONFIGURATION'}>
            <CardBody>
              Card 3
            </CardBody>
          </Collapse>
        </Card>


      </div>
    )
  }

  toggleCards(e) {
    let event = e.target.dataset.event;
    this.setState({ collapseCards: this.state.collapseCards === event ? 'DATA_SELECTION' : event });
  }
}

  const mapStateToProps = (state) => ({
  })   

  const mapDispatchToProps = (dispatch) => ({
   })

  const PlanSettingsComponent = wrapComponentWithProvider(reduxStore, PlanSettings, mapStateToProps, mapDispatchToProps)
  export default PlanSettingsComponent
