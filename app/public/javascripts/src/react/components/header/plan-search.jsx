import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CreatableSelect from 'react-select/creatable';
import { components } from 'react-select';
import AroHttp from '../../common/aro-http'
import ToolBarActions from './tool-bar-actions'
import PlanSearchFilter from './plan-search-filter.jsx'
import uniqBy from 'lodash/uniqBy';
import merge from 'lodash/merge';

const createOption = (label) => ({
  label,
  value: label,
});

const groupStyles = {
  padding: '0px 10px',
  backgroundColor: '#eee',
  color: 'black',
  fontWeight: 'bold',
  borderTop: '1px #aaa solid',
  borderBottom: '1px #aaa solid',
  lineHeight: '28px'
};

const groupBadgeStyles = {
  backgroundColor: '#EBECF0',
  display: 'inline-block',
  fontSize: 12,
  textTransform: 'lowercase'
};

const formatGroupLabel = data => (
  <div style={groupStyles}>
    <span style={groupBadgeStyles}>{data.label}</span>
  </div>
);

const square = (color) => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    content: '" "',
    display: 'block',
    margin: 5,
    height: 10,
    width: 10,
  },
});

export class PlanSearch extends Component {

  constructor (props) {
    super(props)

    this.creatableRef = React.createRef();
    this.searchCreatorsList()

    this.state = {
      inputValue: '',
      search_text: '',
      searchText: [],
      searchList: [],
      allPlans: false,
      systemUsers: [],
      planOptions: {
        url: '/service/v1/plan',
        method: 'GET',
        params: {}
      },
      idToServiceAreaCode: {},
      creatorsSearchList: [],
      plans: [],
      pages: [],
      currentPage: '',
      idToServiceAreaCode: {},
      optionSetText: [],
      isDropDownOption: false,
      isValueRemoved: false
    }

    this.optionSetTextArray = [
      {label: 'tag', options: []},
      {label: 'svc', options: []},
      {label: 'created_by', options: []}
    ]
  }

  componentDidMount () {
    this.loadPlans(1)
  }

  render() {
    const {showRefreshPlansOnMapMove, loggedInUser, listOfTags, listOfServiceAreaTags} = this.props
    const { searchText, plans, currentPage, pages, idToServiceAreaCode, creatorsSearchList,
            optionSetText, isDropDownOption } = this.state;

    // To customize MultiValuelabel in react-select
    // https://codesandbox.io/s/znxjxj556l?file=/src/index.js:76-90
    const MultiValue = props => {
      return (
      <components.MultiValue {...props}>
        {props.data.type &&
          <span className="tag">
            {props.data.type}&nbsp;:&nbsp;
            {props.data.type === 'tag' &&
              <span className="badge badge-primary" style={{ backgroundColor: this.props.getTagColour(props.data) }}>{props.data.value}</span>
            }
            {props.data.type === 'svc' &&
              <span className="badge badge-primary satags">{props.data.value}</span>
            }
            {props.data.type === 'created_by' &&
              <span className="badge badge-primary satags">{props.data.value}</span>
            }            
          </span>
        }
        {!props.data.type &&
          <span className="tag">
            {props.data.label}
          </span>
        }
      </components.MultiValue>
      )
    };

    // To customize control, container, option in react-select
    const customStyles = {
      control: styles => ({ ...styles, backgroundColor: 'white' }),
      container: base => ({
        ...base,
        flex: 1,
        width: 150,
      }),
      option: (styles, state) => ({
        ...styles,
        padding: 3,
        paddingLeft: 10,
        fontSize: 12,
        ...square(this.props.getTagColour(state.data)),
      }),
    }
        
    var newSearchText = [];
    if(searchText !== null) {
      newSearchText = searchText.map((newkey, index) => {
        if (newkey.hasOwnProperty('type')) {
          if(newkey.type === 'tag') return {"id":newkey.id, "name": newkey.name, "value": newkey.name, "label": newkey.name, "type": newkey.type, "colourHue": newkey.colourHue}; 
          if(newkey.type === 'svc') return {"id":newkey.id, "code": newkey.code, "value": newkey.code, "label": newkey.code, "type": newkey.type}; 
          if(newkey.type === 'created_by') return {"id":newkey.fullName, "fullName": newkey.fullName, "value": newkey.fullName, "label": newkey.fullName, "type": newkey.type};  
        } else { return newkey; }
      })
    } else {newSearchText = []; }

    return(
      <div>
        {showRefreshPlansOnMapMove &&
        <div style={{lineHeight: '33px', padding: '5px 0px'}}>
          <input type="checkbox" classame="checkboxfill" name="ctype-name" style={{marginTop: '0px'}} disabled/> Refresh Plans on map move
        </div>
        }

        <div className="input-group">
          <CreatableSelect
            isMulti
            options={optionSetText}
            value={newSearchText}
            placeholder="Search for Plan Names"
            styles={customStyles}
            components={{ MultiValue, DropdownIndicator: null }}
            menuIsOpen={isDropDownOption}
            closeMenuOnSelect={true}
            isClearable={false}
            onChange={(e, action)=>this.handleChange(e, action)}
            onInputChange={(e, action)=>this.handleInputChange(e, action)}
            formatGroupLabel={(e)=>formatGroupLabel(e)}
            onBlur={(e)=>this.onBlur(e)}
            onFocus={(e)=>this.onFocus(e)}
            ref={ref => {
              this.creatableRef = ref;
            }}
          />
          <button className="btn btn-light input-group-append" onClick={(e)=>this.onClikCreateValue(e)} style={{cursor:'pointer'}}>
            <span className="fa fa-search"></span>
          </button>
        </div>

        <div className="plan-info" style={{display: 'flex'}}>
          <span style={{flex: '0 0 auto', lineHeight: '33px', padding: '0px 12px'}}>Filter by:</span>
          <PlanSearchFilter
            objectName="Tag"
            searchProperty="name"
            searchList={listOfTags}
            applySearch={this.applySearchFilter.bind(this, 'tag')}
          />
          <PlanSearchFilter
            objectName="Service Area"
            searchProperty="code"
            searchList={listOfServiceAreaTags}
            applySearch={this.applySearchFilter.bind(this, 'svc')}
          />
          <PlanSearchFilter
            objectName="Creator"
            searchProperty="fullName"
            searchList={creatorsSearchList}
            applySearch={this.applySearchFilter.bind(this, 'created_by')}
          />
        </div>

        {plans.length < 1 &&
          <p className="text-center">No plans found</p>
        }

        {plans.length > 0 &&
        <>
          <table id="tblSelectPlans" className="table table-sm table-striped">
            <tbody>
              {plans.map((plan, index) =>
                <tr key={index}>
                  <td>
                    <b><span className="aro-faux-anchor" onClick={(e)=>this.onPlanClicked(plan)}>{plan.name}</span></b>
                    {plan.createdBy &&
                      <div>
                        <i>{this.getPlanCreatorName(plan.createdBy) || 'loading...'}</i>
                      </div>
                    }
                    <div className="tags"></div>
                    {this.getTagCategories(plan.tagMapping.global).map((tag, index) => {
                      return (
                      <div key={index} className="badge badge-primary" 
                        style={{ backgroundColor: this.props.getTagColour(tag) }}
                      >
                        <span> {tag.name} &nbsp;
                          {loggedInUser.isAdministrator &&
                            <i className="fa fa-times pointer" onClick={(e)=>this.updateTag(plan, {type:'general',tag:tag})}></i>
                          } 
                        </span>
                      </div>
                      )
                    })}
                    <div className="tags"></div>
                    {plan.tagMapping.linkTags.serviceAreaIds.map((serviceAreaId, index) => {
                      return (
                      <div key={index} className="badge satags">
                        <span> {idToServiceAreaCode[serviceAreaId] || 'loading...'} &nbsp;
                          {loggedInUser.isAdministrator &&
                            <i className="fa fa-times pointer" onClick={(e)=>this.updateTag(plan, {type:'svc',serviceAreaId:serviceAreaId})}></i>
                          } 
                        </span>
                      </div>
                      )
                    })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <nav className="text-center" style={{maxHeight: '35px'}}>
          <ul className="pagination" style={{margin: '0px'}}>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <span className="page-link" aria-label="Previous" onClick={(e)=>this.loadPlans(currentPage - 1)}>
                <span aria-hidden="true">&laquo;</span>
              </span>
            </li>
            {pages.map((page, index) => {
              return (
                <li key={index} className={`page-item ${page ===  currentPage ? 'active' : ''}`}>
                  <span className="page-link" onClick={(e)=>this.loadPlans(page)}>{ page }</span>
                </li>
              )
            })}
            <li className={`page-item ${currentPage === pages[pages.length - 1] ? 'disabled' : ''}`}>
              <span className="page-link" aria-label="Next" onClick={(e)=>this.loadPlans(pages[pages.length - 1])}>
                <span aria-hidden="true">&raquo;</span>
              </span>
            </li>
          </ul>
          </nav>
        </>
        }
      </div>
    )
  }

  focusCreatable  () {
    this.creatableRef.focus();
  };

  onFocus (e)  {
    if(this.state.isValueRemoved){
      this.setState({ isDropDownOption: true });
    }
  };

  onBlur (e)  {
    this.setState({ isDropDownOption: false });
  };

  onClikCreateValue (e) {
    const { inputValue, searchText } = this.state;

    if (!inputValue) return;
    this.setState({
      inputValue: '',
      searchText: [...searchText, createOption(inputValue)],
    }, () =>{
      this.loadPlans()
    })
    e.stopPropagation();
    e.preventDefault();
  }

  handleChange (searchText, { action }) {

    // To perform action while 'remove-value' in react-select
    switch (action) {
      case 'remove-value':
        var newSearchText = searchText;
        if(newSearchText === null){
          newSearchText = [];
          this.setState({ isDropDownOption: true });
        } else {
          newSearchText = searchText;
        }

        // To Format searchText Array as per react-select options
        var formatedObjArray = []
        formatedObjArray = this.state.searchText.map((newkey, index) => {
          if (newkey.hasOwnProperty('type')) {
            if(newkey.type === 'tag') return {"id":newkey.id, "name": newkey.name, "value": newkey.name, "label": newkey.name, "type": newkey.type, "colourHue": newkey.colourHue}; 
            if(newkey.type === 'svc') return {"id":newkey.id, "code": newkey.code, "value": newkey.code, "label": newkey.code, "type": newkey.type}; 
            if(newkey.type === 'created_by') return {"id":newkey.fullName, "fullName": newkey.fullName, "value": newkey.fullName, "label": newkey.fullName, "type": newkey.type};  
          } else { return newkey; }
        })

        // To compare 'newSearchText' and 'formatedObjArray' and get the removed values from reat-select serach bar
        // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
        var onlyInA = newSearchText.filter(this.arrayComparer(formatedObjArray));
        var onlyInB = formatedObjArray.filter(this.arrayComparer(newSearchText));
        var removedValueArray = onlyInA.concat(onlyInB);

        // To Push formatedObjArray to reat-select required options structure
        this.optionSetTextArray.map((newkey, index) => {
          if (newkey.label === removedValueArray[0].type) {
            this.optionSetTextArray[index].options.push(removedValueArray[0])
          }
        })

        // To remove duplicate objects from array
        var uniqueObjArray = this.optionSetTextArray
        uniqueObjArray.map((subarray, index) =>  {
          let filtered = uniqBy(subarray.options, item => item.value)
          uniqueObjArray[index].options = [];
          merge(uniqueObjArray[index].options, filtered)
        })
        
        this.setState({ searchText: newSearchText, optionSetText: _.uniq(uniqueObjArray), isValueRemoved: true }, () => {
          this.loadPlans()
        });
        return;
      default:
        var newSearchText = searchText;
        if(newSearchText === null){
          newSearchText = [];
        } else {
          newSearchText = searchText;
          this.setState({ isDropDownOption: false });
        }
        this.setState({ searchText: newSearchText }, () => {
          this.loadPlans()
        });
        return;
    }
  };

  // To compare two array and find the difference value
  // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
  arrayComparer (otherArray) {
    return function(current){
      return otherArray.filter(function(other){
        return other.value == current.value
      }).length == 0;
    }
  }

  handleInputChange (inputValue, { action }) {
    switch (action) {
      case 'input-change':
        this.setState({ inputValue });
        return;
      default:
        return;
    }
  }

  onPlanClicked (plan) {
    this.props.onPlanSelected && this.props.onPlanSelected({ plan: plan })
  }

  loadServiceAreaInfo (plans) {
    // Load service area ids for all service areas referenced by the plans
    // First determine which ids to fetch. We might already have a some or all of them
    var serviceAreaIdsToFetch = new Set()
    plans.forEach((plan) => {
      plan.tagMapping.linkTags.serviceAreaIds.forEach((serviceAreaId) => {
        if (!this.state.idToServiceAreaCode.hasOwnProperty(serviceAreaId)) {
          serviceAreaIdsToFetch.add(serviceAreaId)
        }
      })
    })
    if (serviceAreaIdsToFetch.size === 0) {
      return
    }

    // Get the ids from aro-service
    let serviceAreaIds = [...serviceAreaIdsToFetch]
    var promises = []
    while (serviceAreaIds.length) {
      var filter = ''
      serviceAreaIds.splice(0, 100).forEach((serviceAreaId, index) => {
        if (index > 0) {
          filter += ' or '
        }
        filter += ` (id eq ${serviceAreaId})`
      })

      promises.push(AroHttp.get(`/service/odata/servicearea?$select=id,code&$filter=${filter}&$orderby=id&$top=10000`))
    }

    return this.props.loadListOfSAPlanTagsById(this.props.listOfServiceAreaTags, promises)
      .then((result) => {
        var idToServiceAreaCode = this.state.idToServiceAreaCode
        result.forEach((serviceArea) => {
          idToServiceAreaCode[serviceArea.id] = serviceArea.code
        })
        this.setState({ idToServiceAreaCode: idToServiceAreaCode })
      })
      .catch((err) => console.error(err))
  }

  loadPlans (page, callback) {
    this.constructSearch()
    this.setState({ currentPage: page || 1 })
    this.maxResults = 10
    if (page > 1) {
      var start = this.maxResults * (page - 1)
      var end = start + this.maxResults
      this.setState({ plans: this.state.allPlans.slice(start, end) })
      this.loadServiceAreaInfo(this.state.plans)
      return
    }

    var load = (callback) => {
      var planOptions = this.state.planOptions
      planOptions.params.user_id = this.props.loggedInUser.id
      planOptions.params.search = this.state.search_text
      planOptions.params.project_template_id = this.props.loggedInUser.projectId

      var esc = encodeURIComponent;
      var queryParams = Object.keys(planOptions.params)
          .map(k => esc(k) + '=' + esc(planOptions.params[k]))
          .join('&');

      var queryString = planOptions.url+'?'+queryParams

      AroHttp.get(queryString)
        .then((response) => {
          var planOptions = this.state.planOptions
          planOptions.params = {}
          this.setState({ planOptions: planOptions })

          AroHttp.get('/optimization/processes').then((running) => {
            this.totalData = []
            this.totalData = response.data.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
            this.totalData.forEach((plan) => {
              var info = running.data.find((status) => status.planId === +plan.id)
              if (info) {
                var diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
                var min = Math.floor(diff / 60)
                var sec = Math.ceil(diff % 60)
                plan.progressString = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`
                plan.progress = info.progress
                plan.startDate = info.startDate
                plan.optimizationState = info.optimizationState
              }
            })

            let allPlans = response.data
            this.setState({ allPlans: allPlans, plans: allPlans.slice(0, this.maxResults) }, () => {
              this.loadServiceAreaInfo(this.state.plans)
            })
            this.pages = []
            var pageSize = Math.floor(response.data.length / this.maxResults) + (response.data.length % this.maxResults > 0 ? 1 : 0)
            for (var i = 1; i <= pageSize; i++) {
              this.pages.push(i)
            }
            this.setState({ pages: this.pages })

            callback && callback()
          })
        })
    }
    setTimeout(
      function() {
        load(callback)
      }.bind(this),500
    );
  }

  updateTag (plan, removeTag) {
    var updatePlan = plan
    if (removeTag.type == 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = _.without(updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.serviceAreaId)
    } else {
      updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removeTag.tag.id)
    }

    return AroHttp.put(`/service/v1/plan`, updatePlan)
      .then((response) => {
        this.loadPlans()
      })
  }

  getPlanCreatorName (createdBy) {
    var creator = this.props.systemActors[createdBy]
    return creator && ((creator.type === 'group') ? creator.name : `${creator.firstName} ${creator.lastName}`)
  }

  constructSearch () {
    this.setState({ search_text: '' })

    var newConstructSearch = [];
    let oldConstructSearch = this.state.searchText;

    if(oldConstructSearch !== null) {
      newConstructSearch = oldConstructSearch.map((item, index) => {
        if (item.hasOwnProperty('type')) {
          return item;
        } else {
          return item.value;
        }
      })
    } else {
      newConstructSearch = [];
    }

    var selectedFilterPlans = _.filter(newConstructSearch, (plan) => {
      if (_.isString(plan)) return plan
    })

    const typeToProperty = {
      svc: 'code',
      tag: 'name',
      created_by: 'fullName'
    }

    var selectedFilters = newConstructSearch
      .filter((item) => typeof item !== 'string')
      .map((item) => `${item.type}:\"${item[typeToProperty[item.type]]}\"`)

    if (selectedFilterPlans.length > 0) selectedFilters = selectedFilters.concat(`"${selectedFilterPlans.join(' ')}"`)
    this.setState({ search_text: selectedFilters.join(' ') })
  }

  getTagCategories (currentPlanTags) {
    return this.props.listOfTags.filter(tag => _.contains(currentPlanTags, tag.id))
  }

  searchCreatorsList (filter) {
    let MAX_CREATORS_FROM_ODATA = 10
    var url = `/service/odata/UserEntity?$select=firstName,lastName,fullName`
    if(filter) {
      url = url + `&$filter=substringof(fullName,'${filter}')`
    }
    url = url + `&$top=${MAX_CREATORS_FROM_ODATA}`

    return AroHttp.get(url)
      .then((response) => {
        this.setState({ creatorsSearchList: response.data })
      })
  }

  applySearchFilter (type, args) {
    const filters = args.selectedFilters.map(item => {
      item.type = type
      return item
    })
    this.applySearch(filters)
    this.focusCreatable()
  }

  applySearch (filters) {
    this.setState({ searchText: _.uniq(this.state.searchText.concat(filters)),
      searchList: _.uniq(this.state.searchList.concat(filters)) }, () => {
        this.loadPlans()
      })
  }
}

const mapStateToProps = (state) => ({
  loggedInUser: state.user.loggedInUser,
  listOfTags: state.toolbar.listOfTags,
  listOfServiceAreaTags: state.toolbar.listOfServiceAreaTags,
})  

const mapDispatchToProps = (dispatch) => ({
  loadListOfSAPlanTagsById: (listOfServiceAreaTags, promises) => dispatch(ToolBarActions.loadListOfSAPlanTagsById(listOfServiceAreaTags, promises)),
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag))
})

const PlanSearchComponent = wrapComponentWithProvider(reduxStore, PlanSearch, mapStateToProps, mapDispatchToProps)
export default PlanSearchComponent