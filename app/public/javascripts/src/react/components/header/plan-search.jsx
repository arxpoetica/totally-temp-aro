import React, { Component } from 'react'
import { connect } from 'react-redux'
import CreatableSelect from 'react-select/creatable'
import { components } from 'react-select'
import AroHttp from '../../common/aro-http'
import ToolBarActions from './tool-bar-actions'
import PlanSearchFilter from './plan-search-filter.jsx'
import { toUTCDate } from '../../common/view-utils.js'
import PlanActions from '../plan/plan-actions.js'
import { getPlanCreatorName, getTagCategories } from '../sidebar/view/plan-info-common.js'
import { uniqBy, arrayComparer } from '../../common/view-utils.js'
import ReactPaginate from 'react-paginate'

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
      VIEW_MODE_PLAN_SEARCH: 'viewModePlanSearch',
    }

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
      optionSetText: [],
      isDropDownOption: false,
      isValueRemoved: false,
      sortByField: this.planSortingOptions[0].sortType,
      pageableData: {
        pageOffset: 0,
        rowsPerPage: 10,
        currentPage: 0,
        pageCount: 0,
        marginPagesDisplayed: 2,
      },
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
    const { searchText, plans, idToServiceAreaCode, creatorsSearchList,
      optionSetText, isDropDownOption, sortByField, allPlans, pageableData } = this.state

    // To customize MultiValuelabel in react-select
    // https://codesandbox.io/s/znxjxj556l?file=/src/index.js:76-90
    const MultiValue = props => {
      return (
        <components.MultiValue {...props}>
          {props.data.type &&
            <span className="tag">
              {props.data.type}<span className="blank-space" />:<span className="blank-space" />
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
      <div className="aro-plan">
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
            className="btn btn-light input-group-append search-button"
            onClick={(event) => this.onClikCreateValue(event)}
          >
            <span className="fa fa-search" />
          </button>
        </div>

        <div className="info">
          <span className="filter">Filter by:</span>
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
            refreshTagList={this.searchCreatorsList.bind(this)}
          />
        </div>

        <div className="info">
          <span className="filter">Sort by:</span>
          <select
            className="form-control-sm sorting"
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
                          {getPlanCreatorName(plan.createdBy, systemActors) || 'loading...' }
                          <span className="blank-space">| created {this.convertTimeStampToDate(plan.createdDate)}</span>
                          <span className="blank-space">| last modified {this.convertTimeStampToDate(plan.updatedDate)}</span>
                        </i>
                      </div>
                    }
                    <div className="tags"></div>
                    {getTagCategories(plan.tagMapping.global, listOfTags).map((tag, ind) => {
                      return (
                        <div key={ind} className="badge badge-primary"
                          style={{ backgroundColor: this.props.getTagColour(tag) }}
                        >
                          <span> {tag.name} <span className="blank-space" />
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
                          <span> {idToServiceAreaCode[serviceAreaId] || 'loading...'} <span className="blank-space" />
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

          {pageableData.rowsPerPage < allPlans.length &&
            <div className="pagination">
              <ReactPaginate
                previousLabel='«'
                nextLabel='»'
                breakLabel={<span className="gap">…</span>}
                marginPagesDisplayed={pageableData.marginPagesDisplayed}
                pageCount={pageableData.pageCount}
                forcePage={pageableData.currentPage}
                onPageChange={(event) => this.handlePageClick(event)}
                activeClassName='active'
                containerClassName='pagination'
                pageClassName='page-item'
                pageLinkClassName='page-link'
                previousLinkClassName='page-link'
                nextLinkClassName='page-link'
                disabledClassName='page-item disabled'
              />
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
        this.setState({ inputValue, isDropDownOption: true })
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
    this.maxResults = this.state.pageableData.rowsPerPage
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
      updatePlan.tagMapping.linkTags.serviceAreaIds = updatePlan.tagMapping.linkTags.serviceAreaIds
        .filter(item => removeTag.serviceAreaId !== item)
    } else {
      updatePlan.tagMapping.global = updatePlan.tagMapping.global.filter(item => removeTag.tag.id !== item)
    }
    return AroHttp.put('/service/v1/plan', updatePlan)
      .then((response) => {
        this.loadPlans()
      })
  }

  constructSearch() {
    const searchTextObject = []
    this.state.searchText.forEach(searchInput => {
      if (searchInput.hasOwnProperty('type')) {
        searchTextObject[searchInput.type] = searchInput
      } else {
        searchTextObject.searchString = searchInput
      }
    })
    const searchText = Object.values(searchTextObject)
    this.setState({ search_text: '', searchText })

    const selectedFilterPlans = searchText.filter(plan => { if (typeof plan === 'string') return plan })

    const typeToProperty = {
      svc: 'code',
      tag: 'name',
      created_by: 'fullName'
    }

    let selectedFilters = searchText
      .filter((item) => typeof item !== 'string')
      .map((item) => {
        if (item.hasOwnProperty('type')) {
          return `${item.type}:"${item[typeToProperty[item.type]]}"`
        }
        return `"${item.value}"`
      })
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
    return new Date(timestamp).toLocaleDateString('en-US')
  }

  handlePageClick(event) {
    const currentpage = event.selected
    this.setPage(currentpage)
    this.loadPlans(currentpage + 1)
  }

  // Pagination
  setPage(page) {
    const { allPlans, pageableData } = this.state
    const { pageOffset, rowsPerPage } = pageableData
    const { sidebarWidth } = this.props

    if (typeof page === 'undefined') {
      page = pageOffset
    }

    page === Math.floor(page)

    let marginPagesDisplayed
    if (sidebarWidth < 30) {
      marginPagesDisplayed = 2
    } else {
      marginPagesDisplayed = 5
    }

    pageableData.pageCount = Math.ceil(allPlans.length / rowsPerPage)
    pageableData.currentPage = page
    pageableData.marginPagesDisplayed = marginPagesDisplayed

    this.setState({ pageableData })
  }

  onPlanDeleteClicked(plan) {
    this.onPlanDeleteRequested(plan)
      .then(() => {
        this.loadPlans()
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

export default connect(mapStateToProps, mapDispatchToProps)(PlanSearch)
