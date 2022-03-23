import { defineStore } from 'pinia'

export type Result = {
  // has more parameters, but these are the essential ones, see https://shop-directory.zeromox.com/api/search
  id: number;
  label: string;
}

export const useSearchResults = defineStore({
  id: 'results',
  state: () => ({
    shown: null as unknown as Result,
    all: [] as Result[],
  }),
//   getters: {
//     doubleCount: (state) => state.counter * 2
//   },
  actions: {
    show(result: Result) {
      this.shown = result;
    }
  }
})
