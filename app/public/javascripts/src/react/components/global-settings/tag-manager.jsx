import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import globalsettingsActions from '../global-settings/globalsettings-action'

export class TagManager extends Component {
  constructor (props) {
    super(props)
    this.state = {
      tag: {
        id:'',
        name:'',
        description:'',
        colourHue:0.0
      }
    }
  }

  componentWillMount () {
    this.props.loadTags()
  }

  createTag(){
    let newTag = this.state.tag;
    newTag["id"] = '';
    newTag["name"] = 'Undefined';
    newTag["description"] = 'Undefined';
    newTag["colourHue"] = 0.5;
    this.setState({ tag: newTag });  
    this.props.setFlag()
  }
  
  updateTag(tag){
    this.props.setFlag()
    if(tag !== null){
      let updatedTag = this.state.tag;
      updatedTag["id"] = tag.id;
      updatedTag["name"] = tag.name;
      updatedTag["description"] = tag.description;
      updatedTag["colourHue"] = tag.colourHue;
      this.setState({ tag: updatedTag });  
    }
  }
  handleChange (e) {
    let tag = this.state.tag;
    tag[e.target.name] = e.target.value;
    this.setState({ tag: tag });  
  }

  saveTag(){
    if(this.state.tag.id !== '' && this.state.tag !== undefined){
      this.props.updateTag(this.state.tag)
    }else{
      this.props.createTag(this.state.tag)
    }
  }

  render () {
    return !this.props.tags
      ? null
      : <>
          {this.renderTags()}
        </>
  }

  renderTags () {
    const tags = this.props.tags

    return (
      <div className="no-collapse" style={{display: 'flex',flexDirection: 'column', height: '100%'}}>
        {
        !this.props.isCreateOrUpdate &&
        <>
          <div style={{flex: "1 1 auto"}}>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Color</th>
                  </tr>
              </thead>
              <tbody>
              {
                tags.map((tag,index)=>{  
                  return <tr key={index}>
                    <td><span className="aro-faux-anchor" onClick={() => this.updateTag(tag)}>{tag.name}</span></td>
                    <td>{tag.description}</td>
                    <td>{tag.colourHue}</td>
                  </tr>
                })
              }
              </tbody>
            </table>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button type="submit" className={'btn btn-primary float-right'} onClick={() => this.createTag()}>Create Tag</button>
            </div>
            </>
        }
        {
        this.props.isCreateOrUpdate &&
        <>
          <div style={{flex: "1 1 auto"}}>
            <form>
              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Name</label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" name="name" value={this.state.tag.name} onChange={(e)=>this.handleChange(e)}/>
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-4 col-form-label">Description</label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" name="description"  value={this.state.tag.description} onChange={(e)=>this.handleChange(e)}/>
                </div>
              </div>
              <div className="form-group row" style={{saturation:'50%',value:'37.5%'}}>
                <label className="col-sm-4 col-form-label">Color Hue</label>
                <div className="col-sm-8">
                  <div className="hue">
                    <input name="colourHue" 
                      style={{width:'100%', marginTop: '5px'}}
                      type="range" min="0" max="1" step="0.01" 
                      value={this.state.tag.colourHue} 
                      onChange={(e)=>this.handleChange(e)}/>
                  </div>
                </div>  
              </div>  
              
            </form>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button className={'btn btn-primary float-right'} onClick={() => this.saveTag()}><i className={'fa fa-save'} />&nbsp;&nbsp;Save Tag</button>
            </div>
          </>
        }
      </div>
    )
  }
}


const mapStateToProps = (state) => ({
  tags: state.globalSettings.tags,
  isCreateOrUpdate: state.globalSettings.isCreateOrUpdate
})

const mapDispatchToProps = (dispatch) => ({
  loadTags: () => dispatch(globalsettingsActions.loadTags()),
  setFlag: () => dispatch(globalsettingsActions.setFlag()),
  createTag: (tag) => dispatch(globalsettingsActions.createTag(tag)),
  updateTag: (tag) => dispatch(globalsettingsActions.updateTag(tag))
})

const TagManagerComponent = wrapComponentWithProvider(reduxStore, TagManager, mapStateToProps, mapDispatchToProps)
export default TagManagerComponent
