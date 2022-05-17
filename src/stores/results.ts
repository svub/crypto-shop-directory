import { defineStore } from 'pinia'

export type Result = {
  // has more parameters, but these are the essential ones, see https://shop-directory.zeromox.com/api/search
  id: number;
  label: string;
  description: string;
  phone: string;
  accepts: string[];
  website: string;
  place: Place;
}

export type Place = {
  formatted_address: string; // mail address
  business_status: string; // could be "CLOSED_PERMANENTLY"
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  opening_hours: {
    weekday_text: string[]; // one entrey per day starting Monday
  };
  rating: number; // average rating
  user_ratings_total: number; // number of ratings
  types: string[];
  url: string; // link to Google Maps entry
  vicinity: string; // simple address
}

export type ResultsState = {
  shown?: Result,
  place?: Place,
  all: Result[],
  boundingBox: number[],
}

export const useSearchResults = defineStore({
  id: 'results',
  state: () => ({ // state is reactive, items not
    shown: undefined,
    place: undefined,
    all: [],
    boundingBox: [0, 0, 0, 0], // north east south west
  } as ResultsState),
  getters: { // reactive!

  },
  actions: {
    show(result?: Result) {
      this.shown = result;
    },
    setBoundingBox(north: number, east: number, south: number, west: number) {
      this.boundingBox = [north, east, south, west];
    },
  }
})
