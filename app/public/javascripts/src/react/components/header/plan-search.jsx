import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import CreatableSelect from 'react-select/creatable'
import { components } from 'react-select'
import AroHttp from '../../common/aro-http'
import ToolBarActions from './tool-bar-actions'
import PlanSearchFilter from './plan-search-filter.jsx'
import { toUTCDate } from '../../common/view-utils.js'
import PlanActions from '../plan/plan-actions.js'
import { getPlanCreatorName, getTagCategories } from '../sidebar/view/plan-info-common.js'
import { without, isString, uniqBy, arrayComparer } from '../../common/view-utils.js'

const createOption = (label) => ({
  label,
  value: label,
})

const groupStyles = {
  padding: '0px 10px',
  backgroundColor: '#eee',
  color: 'black',
  fontWeight: 'bold',
  borderTop: '1px #aaa solid',
  borderBottom: '1px #aaa solid',
  lineHeight: '28px'
}

const groupBadgeStyles = {
  backgroundColor: '#EBECF0',
  display: 'inline-block',
  fontSize: 12,
  textTransform: 'lowercase'
}

const formatGroupLabel = data => (
  <div style={groupStyles}>
    <span style={groupBadgeStyles}>{data.label}</span>
  </div>
)

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
})

export class PlanSearch extends Component {

  constructor(props) {
    super(props)

    this.creatableRef = React.createRef()
    this.searchCreatorsList()

    this.planSortingOptions = [
      { sortType: 'updatedDate', description: 'Date Modified' },
      { sortType: 'createdDate', description: 'Date Created' },
    ]

    this.currentView = {
      SAVE_PLAN_SEARCH: 'savePlanSearch',
      VIEW_MODE_PLAN_SEARCH: 'viewModePlanSearch'
    }

    this.lastPage = 0
    this.rowsPerPage = 10

    this.state = {
      inputValue: '',
      search_text: '',
      searchText: [],
      searchList: [],
      allPlans: false,
      planOptions: {
        url: '/service/v1/plan',
        method: 'GET',
        params: {}
      },
      idToServiceAreaCode: {},
      creatorsSearchList: [],
      plans: [],
      pages: [],
      optionSetText: [],
      isDropDownOption: false,
      isValueRemoved: false,
      sortByField: this.planSortingOptions[0].sortType,
      pageOffset: 0
    }

    this.optionSetTextArray = [
      { label: 'tag', options: [] },
      { label: 'svc', options: [] },
      { label: 'created_by', options: [] }
    ]
  }

  componentDidMount() {
    this.loadPlans(1)
    this.setPage()
  }

  componentDidUpdate(prevProps) {
    if (this.props.sidebarWidth !== prevProps.sidebarWidth) {
      this.setPage()
    }
  }

  render() {
    const { loggedInUser, listOfTags, listOfServiceAreaTags, showPlanDeleteButton, systemActors} = this.props
    const { searchText, plans, pages, idToServiceAreaCode, creatorsSearchList,
      optionSetText, isDropDownOption, sortByField, allPlans, pageOffset } = this.state

    // To customize MultiValuelabel in react-select
    // https://codesandbox.io/s/znxjxj556l?file=/src/index.js:76-90
    const MultiValue = props => {
      return (
        <components.MultiValue {...props}>
          {props.data.type &&
            <span className="tag">
              {props.data.type}&nbsp;:&nbsp;
              {props.data.type === 'tag' &&
                <span
                  className="badge badge-primary"
                  style={{ backgroundColor: this.props.getTagColour(props.data) }}
                >
                  {props.data.value}
                </span>
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
    }

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

    let newSearchText = []
    if (searchText !== null) {
      newSearchText = searchText.map((newkey) => {
        if (newkey.hasOwnProperty('type')) {
          if (newkey.type === 'tag') {
            return { id: newkey.id, name: newkey.name, value: newkey.name, label: newkey.name,
              type: newkey.type, colourHue: newkey.colourHue }
          }
          if (newkey.type === 'svc') {
            return { id: newkey.id, code: newkey.code, value: newkey.code,
              label: newkey.code, type: newkey.type }
          }
          if (newkey.type === 'created_by') {
            return { id: newkey.fullName, fullName: newkey.fullName, value: newkey.fullName,
              label: newkey.fullName, type: newkey.type }
          }
        } else { return newkey }
      })
    } else { newSearchText = [] }

    return (
      <div>
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
            onChange={(event, action) => this.handleChange(event, action)}
            onInputChange={(event, action) => this.handleInputChange(event, action)}
            formatGroupLabel={(event) => formatGroupLabel(event)}
            onBlur={(event) => this.onBlur(event)}
            onFocus={() => this.onFocus()}
            ref={ref => {
              this.creatableRef = ref
            }}
          />
          <button
            className="btn btn-light input-group-append"
            onClick={(event) => this.onClikCreateValue(event)}
            style={{ cursor: 'pointer', alignItems: 'center' }}
          >
            <span className="fa fa-search" />
          </button>
        </div>

        <div className="plan-info" style={{ display: 'flex' }}>
          <span style={{ flex: '0 0 auto', lineHeight: '33px', padding: '0px 12px' }}>Filter by:</span>
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
            refreshTagList={this.onRefreshTagList.bind(this)}
          />
          <PlanSearchFilter
            objectName="Creator"
            searchProperty="fullName"
            searchList={creatorsSearchList}
            applySearch={this.applySearchFilter.bind(this, 'created_by')}
          />
        </div>

        <div className="plan-info" style={{ display: 'flex', paddingTop: '5px' }}>
          <span style={{ flex: '0 0 auto', lineHeight: '33px', padding: '0px 12px' }}>Sort by:</span>
          <select
            className="form-control-sm"
            style={{ background: '#f8f9fa', border: '0px', outline: '0px' }}
            value={sortByField}
            onChange={(event) => this.onChangeSortingType(event)}>
            {this.planSortingOptions.map((item, index) =>
              <option key={index} value={item.sortType} label={item.description} />
            )}
          </select>
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
                    <b>
                      <span className="aro-faux-anchor" onClick={() => this.onPlanClicked(plan)}>{plan.name}</span>
                    </b>
                    {plan.createdBy &&
                      <div>
                        <i>
                          {getPlanCreatorName(plan.createdBy, systemActors) || 'loading...'}
                          &nbsp;| created {this.convertTimeStampToDate(plan.createdDate)}
                          &nbsp;| last modified {this.convertTimeStampToDate(plan.updatedDate)}
                        </i>
                      </div>
                    }
                    <div className="tags"></div>
                    {getTagCategories(plan.tagMapping.global, listOfTags).map((tag, ind) => {
                      return (
                        <div key={ind} className="badge badge-primary"
                          style={{ backgroundColor: this.props.getTagColour(tag) }}
                        >
                          <span> {tag.name} &nbsp;
                            {loggedInUser.isAdministrator &&
                              <i className="fa fa-times pointer"
                                onClick={() => this.updateTag(plan, { type: 'general', tag })}
                              />
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
                              <i className="fa fa-times pointer"
                                onClick={() => this.updateTag(plan, { type: 'svc', serviceAreaId })}
                              />
                            }
                          </span>
                        </div>
                      )
                    })}
                  </td>
                  <td>
                    {plan.progress &&
                      <a className="btn btn-success" onClick={() => this.stopOptimization(plan)}>
                        <span className="fa fa-stop"></span>
                      </a>
                    }
                    {!plan.progress && showPlanDeleteButton &&
                      <a className="btn btn-danger" onClick={() => this.onPlanDeleteClicked(plan)}>
                        <span className="fa fa-trash-alt text-white"></span>
                      </a>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {this.rowsPerPage < allPlans.length &&
            <div style={{ padding: '8px' }}>
              <ul className="pagination" style={{ margin: '0px' }}>
                <li className={`page-item ${pageOffset === 0 ? 'disabled' : ''}`}>
                  <span className="page-link" aria-label="Previous" onClick={() => this.changePage(pageOffset - 1)}>
                    <span aria-hidden="true">&laquo;</span>
                  </span>
                </li>
                {pages.map((page, index) => {
                  return (
                    <li key={index} className={`page-item ${pageOffset === page ? 'active' : ''}`}>
                      <span className={`${-1 !== page ? 'page-link' : ''} ${-1 === page ? 'break' : ''}`}
                        onClick={() => {this.loadPlans(page + 1); this.setPage(page)}}>
                        {-1 === page ? '…' : page+1}
                      </span>
                    </li>
                  )
                })
                }
                <li className={`page-item ${pageOffset === pages[pages.length - 1] ? 'disabled' : ''}`}>
                  <span className="page-link" aria-label="Next"
                    onClick={() => this.changePage(pageOffset + 1)}>
                    <span aria-hidden="true">&raquo;</span>
                  </span>
                </li>
              </ul>
            </div>
          }
        </>
        }
      </div>
    )
  }

  onRefreshTagList(dataItems, filterObj, isHardReload) {
    this.props.loadListOfSAPlanTags(dataItems, filterObj, isHardReload)
  }

  focusCreatable() {
    this.creatableRef.focus()
  }

  onFocus() {
    if (this.state.isValueRemoved) {
      this.setState({ isDropDownOption: true })
    }
  }

  onBlur() {
    this.setState({ isDropDownOption: false })
  }

  onClikCreateValue(event) {
    const { inputValue, searchText } = this.state

    if (!inputValue) return
    this.setState({
      inputValue: '',
      searchText: [...searchText, createOption(inputValue)],
    }, () => {
      this.loadPlans()
    })
    event.stopPropagation()
    event.preventDefault()
  }

  handleChange(searchText, { action }) {

    let newSearchText = searchText
    // To perform action while 'remove-value' in react-select
    switch (action) {
      case 'remove-value':
        if (newSearchText === null) {
          newSearchText = []
          this.setState({ isDropDownOption: true })
        } else {
          newSearchText = searchText
        }

        // To Format searchText Array as per react-select options
        let formatedObjArray = []
        formatedObjArray = this.state.searchText.map((newkey, index) => {
          if (newkey.hasOwnProperty('type')) {
            if (newkey.type === 'tag') {
              return { id: newkey.id, name: newkey.name, value: newkey.name,
                label: newkey.name, type: newkey.type, colourHue: newkey.colourHue }
            }
            if (newkey.type === 'svc') {
              return { id: newkey.id, code: newkey.code, value: newkey.code,
                label: newkey.code, type: newkey.type }
            }
            if (newkey.type === 'created_by') {
              return { id: newkey.fullName, fullName: newkey.fullName,
                value: newkey.fullName, label: newkey.fullName, type: newkey.type }
            }
          } else { return newkey }
        })

        // To compare 'newSearchText' and 'formatedObjArray' and get the removed values from reat-select serach bar
        // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
        const onlyInA = newSearchText.filter(arrayComparer(formatedObjArray))
        const onlyInB = formatedObjArray.filter(arrayComparer(newSearchText))
        const removedValueArray = onlyInA.concat(onlyInB)

        // To Push formatedObjArray to reat-select required options structure
        this.optionSetTextArray.map((newkey, index) => {
          if (newkey.label === removedValueArray[0].type) {
            this.optionSetTextArray[index].options.push(removedValueArray[0])
            // To remove duplicate objects from array
            this.optionSetTextArray[index].options = uniqBy(newkey.options, item => item.value)
          }
        })

        this.setState({ searchText: newSearchText,
          optionSetText: [...new Set(this.optionSetTextArray)], isValueRemoved: true }, () => {
          this.loadPlans()
        })
        return
      default:
        if (newSearchText === null) {
          newSearchText = []
        } else {
          newSearchText = searchText
          this.setState({ isDropDownOption: false })
        }
        this.setState({ searchText: newSearchText }, () => {
          this.loadPlans()
        })
        return
    }
  }

  handleInputChange(inputValue, { action }) {
    switch (action) {
      case 'input-change':
        this.setState({ inputValue })
        return
      default:
        return
    }
  }

  onPlanClicked(plan) {
    if (this.props.currentView === this.currentView.SAVE_PLAN_SEARCH) {
      this.props.onPlanSelected && this.props.onPlanSelected({ plan })
    } else if (this.props.currentView === this.currentView.VIEW_MODE_PLAN_SEARCH) {
      this.props.loadPlan(plan.id)
    }
  }

  loadServiceAreaInfo(plans) {
    // Load service area ids for all service areas referenced by the plans
    // First determine which ids to fetch. We might already have a some or all of them
    const serviceAreaIdsToFetch = new Set()
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
    const serviceAreaIds = [...serviceAreaIdsToFetch]
    const promises = []
    while (serviceAreaIds.length) {
      let filter = ''
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
        const idToServiceAreaCode = this.state.idToServiceAreaCode
        result.forEach((serviceArea) => {
          idToServiceAreaCode[serviceArea.id] = serviceArea.code
        })
        this.setState({ idToServiceAreaCode })
      })
      .catch((err) => console.error(err))
  }

  loadPlans(page, callback) {
    this.constructSearch()
    this.maxResults = this.rowsPerPage
    if (page > 1) {
      const start = this.maxResults * (page - 1)
      const end = start + this.maxResults
      this.setState({ plans: this.state.allPlans.slice(start, end) })
      this.loadServiceAreaInfo(this.state.plans)
      return
    }

    const load = (callback) => {
      const planOptions = this.state.planOptions
      planOptions.params.user_id = this.props.loggedInUser.id
      planOptions.params.search = this.state.search_text
      planOptions.params.project_template_id = this.props.loggedInUser.projectId

      const esc = encodeURIComponent
      const queryParams = Object.keys(planOptions.params)
        .map(k => esc(k) + '=' + esc(planOptions.params[k]))
        .join('&')

      const queryString = planOptions.url + '?' + queryParams

      AroHttp.get(queryString)
        .then((response) => {
          const planOptions = this.state.planOptions
          planOptions.params = {}
          this.setState({ planOptions })

          AroHttp.get('/optimization/processes').then((running) => {
            this.totalData = []
            this.totalData = response.data.sort((a, b) => (a[this.state.sortByField] < b[this.state.sortByField]) ? 1 : -1)
            this.totalData.forEach((plan) => {
              const info = running.data.find((status) => status.planId === +plan.id)
              if (info) {
                const diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
                const min = Math.floor(diff / 60)
                const sec = Math.ceil(diff % 60)
                plan.progressString = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`
                plan.progress = info.progress
                plan.startDate = info.startDate
                plan.optimizationState = info.optimizationState
              }
            })

            const allPlans = response.data
            this.setState({ allPlans, plans: allPlans.slice(0, this.maxResults) }, () => {
              this.loadServiceAreaInfo(this.state.plans)
            })
            this.setPage()
            callback && callback()
          })
        })
    }
    setTimeout(
      function() {
        load(callback)
      }.bind(this), 500
    )
  }

  updateTag(plan, removeTag) {
    const updatePlan = plan
    if (removeTag.type === 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = without(
        updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.serviceAreaId
      )
    } else {
      updatePlan.tagMapping.global = without(updatePlan.tagMapping.global, removeTag.tag.id)
    }

    return AroHttp.put('/service/v1/plan', updatePlan)
      .then((response) => {
        this.loadPlans()
      })
  }

  constructSearch() {
    this.setState({ search_text: '' })

    let newConstructSearch = []
    const oldConstructSearch = this.state.searchText

    if (oldConstructSearch !== null) {
      newConstructSearch = oldConstructSearch.map((item, index) => {
        if (item.hasOwnProperty('type')) {
          return item
        } else {
          return item.value
        }
      })
    } else {
      newConstructSearch = []
    }

    const selectedFilterPlans = newConstructSearch.filter(plan => { if (isString(plan)) return plan })

    const typeToProperty = {
      svc: 'code',
      tag: 'name',
      created_by: 'fullName'
    }

    let selectedFilters = newConstructSearch
      .filter((item) => !isString(item))
      .map((item) => `${item.type}:\"${item[typeToProperty[item.type]]}\"`)

    if (selectedFilterPlans.length > 0) selectedFilters = selectedFilters.concat(`"${selectedFilterPlans.join(' ')}"`)
    this.setState({ search_text: selectedFilters.join(' ') })
  }

  searchCreatorsList(filter) {
    const MAX_CREATORS_FROM_ODATA = 10
    let url = '/service/odata/UserEntity?$select=firstName,lastName,fullName'
    if (filter) {
      url = url + `&$filter=substringof(fullName,'${filter}')`
    }
    url = url + `&$top=${MAX_CREATORS_FROM_ODATA}`

    return AroHttp.get(url)
      .then((response) => {
        this.setState({ creatorsSearchList: response.data })
      })
  }

  applySearchFilter(type, args) {
    const filters = args.selectedFilters.map(item => {
      item.type = type
      return item
    })
    this.applySearch(filters)
    this.focusCreatable()
  }

  applySearch(filters) {
    this.setState({ searchText: [...new Set(this.state.searchText.concat(filters))],
      searchList: [...new Set(this.state.searchList.concat(filters))] }, () => {
      this.loadPlans()
    })
  }

  onChangeSortingType(event) {
    this.setState({ sortByField: event.target.value })
    this.loadPlans()
  }

  convertTimeStampToDate(timestamp) {
    const utcDate = toUTCDate(new Date(timestamp))
    return new Intl.DateTimeFormat('en-US').format(utcDate)
  }

  changePage(page) {
    this.loadPlans(page)
    this.setPage(page)
  }

  // Pagination
  setPage(page) {
    if (typeof page === 'undefined') {
      page = this.state.pageOffset
    }

    page === Math.floor(page)

    this.lastPage = Math.floor((this.state.allPlans.length - 1) / this.rowsPerPage)
    if (this.lastPage < 0) this.lastPage = 0
    if (isNaN(this.lastPage)) this.lastPage = 0

    if (page > this.lastPage) {
      page = this.lastPage
    }

    if (page < 0) page = 0

    let newPages = []
    // -1 indicates "..."
    // Change the newPages size based on sidebarWidth
    if (this.props.sidebarWidth < 30) {
      if (this.lastPage < 8) {
        newPages = [...Array(this.lastPage + 1).keys()]
      } else if (page < 2 || page + 2 > this.lastPage) {
        newPages = [0, 1, 2, 3, -1, this.lastPage - 2, this.lastPage - 1, this.lastPage]
      } else if (page === 2) {
        newPages = [0, 1, 2, 3, 4, -1, this.lastPage - 1, this.lastPage]
      } else if (this.lastPage - 2 === page) {
        newPages = [0, 1, 2, -1, this.lastPage - 3, this.lastPage - 2, this.lastPage - 1, this.lastPage]
      } else {
        newPages = [0, -1, page - 1, page, page + 1, -1, this.lastPage - 1, this.lastPage]
      }
    } else {
      if (this.lastPage < 10) {
        newPages = [...Array(this.lastPage + 1).keys()]
      } else if (page < 4 || page + 2 > this.lastPage) {
        newPages = [0, 1, 2, 3, 4, -1, this.lastPage - 3, this.lastPage - 2, this.lastPage - 1, this.lastPage]
      } else if (page === 4) {
        newPages = [0, 1, 2, 3, 4, 5, -1, this.lastPage - 2, this.lastPage - 1, this.lastPage]
      } else if (this.lastPage - 3 === page) {
        newPages = [0, 1, 2, 3, -1, this.lastPage - 4, this.lastPage - 3, this.lastPage - 2, this.lastPage - 1, this.lastPage]
      } else if (this.lastPage - 2 === page) {
        newPages = [0, 1, 2, -3, -1, page - 2, page - 1, page, this.lastPage - 1, this.lastPage]
      } else {
        newPages = [0, 1, 2, -1, page - 1, page, page + 1, page + 2, -1, this.lastPage]
      }
    }

    this.setState({ pages: newPages, pageOffset: page })
  }

  onPlanDeleteClicked(plan) {
    this.onPlanDeleteRequested(plan)
      .then(() => {
        this.loadPlans()
        this.setPage(0)
      })
      .catch((err) => {
        console.error(err)
        this.loadPlans()
      })
  }

  onPlanDeleteRequested(plan) {
    return this.props.deletePlan(plan)
  }
}

const mapStateToProps = (state) => ({
  loggedInUser: state.user.loggedInUser,
  listOfTags: state.toolbar.listOfTags,
  listOfServiceAreaTags: state.toolbar.listOfServiceAreaTags,
  sidebarWidth: state.toolbar.sidebarWidth,
  systemActors: state.user.systemActors,
})

const mapDispatchToProps = (dispatch) => ({
  loadListOfSAPlanTagsById: (listOfServiceAreaTags, promises) => dispatch(
    ToolBarActions.loadListOfSAPlanTagsById(listOfServiceAreaTags, promises)
  ),
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag)),
  loadListOfSAPlanTags: (dataItems, filterObj, ishardreload) => dispatch(
    ToolBarActions.loadListOfSAPlanTags(dataItems, filterObj, ishardreload)
  ),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
  deletePlan: (plan) => dispatch(PlanActions.deletePlan(plan)),

})

export default wrapComponentWithProvider(reduxStore, PlanSearch, mapStateToProps, mapDispatchToProps)
