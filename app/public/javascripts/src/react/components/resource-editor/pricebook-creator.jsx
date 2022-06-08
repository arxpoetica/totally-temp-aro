import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class PriceBookCreator extends Component {
  constructor (props) {
    super(props)
    this.state = {
      priceBook: {
        strategy:'',
        name:'New PriceBook',
        description:'New PriceBook Description'
      }
    }
  }

  componentDidMount () {
    this.props.getPriceBookStrategy();
    this.props.setModalTitle('Create Price Book')
  }

  render () {
    return this.props.priceBookStrategy === null
      ? null
      : this.renderPriceBookCreator()
  }  

  renderPriceBookCreator()  {
    return (
       <>
        <div style={{display: 'flex', flexDirection: 'column', height: '90%'}}>
          <div style={{flex: '1 1 auto'}}>
            <form className="form-horizontal">
               {/* The source pricebook used when cloning  */}
               {
                this.props.cloneManager &&
                  <div className="form-group">
                    <label className="col-sm-4 control-label">PriceBook to clone</label>
                    <div className="col-sm-8">
                      <input disabled className="form-control" value={this.props.cloneManager.name}/>
                    </div>
                  </div>
               }

              {/* The price strategy to be used for the pricebook. Can only be changed when creating a new pricebook (not when cloning)  */}
              <div className="form-group">
                <label className="col-sm-4 control-label">Price Strategy</label>
                <div className="col-sm-8">
                  <select className="form-control" disabled={this.props.cloneManager} name="strategy" onChange={(e)=>this.handleChange(e)} value={this.state.priceBook.strategy}>
                  {this.props.priceBookStrategy.map(item => <option value={item.name} key={item.name}>{item.description}</option>)}
                  </select>
                  {/* If we are cloning an existing pricebook, show a message explaining why strategy is disabled */}
                  {
                    this.props.cloneManager &&
                      <small className="form-text text-muted">You cannot change strategy when cloning an existing PriceBook</small> 
                  }
                </div>
              </div>

              {/* <!-- The name of the new pricebook --> */}
              <div className="form-group">
                <label className="col-sm-4 control-label">Name</label>
                <div className="col-sm-8">
                  <input className="form-control" name="name" value={this.state.priceBook.name} 
                    onChange={(e)=>this.handleChange(e)}/>
                </div>
              </div>

              {/* <!-- The description of the new pricebook --> */}
              <div className="form-group">
                  <label className="col-sm-4 control-label">Description</label>
                  <div className="col-sm-8">
                    <input className="form-control" name="description" value={this.state.priceBook.description} 
                      onChange={(e)=>this.handleChange(e)}/>
                  </div>
                </div>
            </form>
          </div>
          <div style={{flex: '0 0 auto'}}>
            <div style={{textAlign: 'right'}}>
              <button className="btn btn-light mr-2" onClick={() => this.handleBack()}>
                <i className="fa fa-undo action-button-icon"></i>Back
              </button>
              <button className="btn btn-primary" onClick={() => this.handleCreatePriceBook()}>
                <i className="fa fa-save action-button-icon"></i>Create
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  handleChange (e) {
    let priceBook = this.state.priceBook;
    priceBook[e.target.name] = e.target.value;
    this.setState({ priceBook: priceBook });  
  }

  handleBack(){
    this.props.setIsResourceEditor(true);
  }

  handleCreatePriceBook(){
    this.props.createPriceBook(this.state.priceBook, this.props.cloneManager);
  }
}

  const mapStateToProps = (state) => ({
    priceBookStrategy: state.resourceEditor.priceBookStrategy,
  })   

  const mapDispatchToProps = (dispatch) => ({
    getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
    searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
    getPriceBookStrategy: () => dispatch(ResourceActions.getPriceBookStrategy()),
    createPriceBook: (priceBook, cloneManager) => dispatch(ResourceActions.createPriceBook(priceBook, cloneManager)),
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
  })

const PriceBookCreatorComponent = connect(mapStateToProps, mapDispatchToProps)(PriceBookCreator)
export default PriceBookCreatorComponent