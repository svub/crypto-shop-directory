import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_KEY = 'AIzaSyAjYtV3lxyenUKIrAkPGuc4-izKx0pAW14';
const GOOGLE_API = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=';

const loader = new Loader({
  apiKey: GOOGLE_KEY,
  version: "weekly",
  libraries: ["places"]
});

const loadingApi = loader.load();
async function getApi() {
    const api = await loadingApi;
    return new google.maps.places.PlacesService(document.getElementById('placeService') as HTMLDivElement);
}

// const mapOptions = {
//   center: {
//     lat: 0,
//     lng: 0
//   },
//   zoom: 4
// };

async function details(placeId: string) {
  const fields = ['name', 'rating', 'formatted_phone_number', 'geometry'];
  const promise = new Promise(async (resolve, reject) => {
    const api = await getApi();
    api.getDetails({ placeId, fields, }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) resolve(place)
      else reject(status);
    });
  });
  return promise;
//   const url = GOOGLE_API + id;
//   const response = await fetch(url);
//   return await response.json();
}


export function useGooglePlaces() { return {
  details,
}}
