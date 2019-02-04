import reduxStore from './redux-store'

const reduxConfig = ['$ngReduxProvider', ($ngReduxProvider) => {
  $ngReduxProvider.provideStore(reduxStore);
}]

export default reduxConfig
