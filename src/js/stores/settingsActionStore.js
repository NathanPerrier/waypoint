
// First import createStore function from Framework7 core
import { createStore } from 'framework7';

// create store
const settingsActionStore = createStore({
  // start with the state (store data)
  state: {
    
  },

  // actions to operate with state and for async manipulations
  actions: {
    // context object containing store state will be passed as an argument
    
    // ...
  },

  // getters to retrieve the state
  getters: {
    // context object containing store state will be passed as an argument

  }

})

// export store
export default settingsActionStore;