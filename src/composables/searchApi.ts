const API = 'https://shop-directory.zeromox.com/api';

export class ExpiredRequest extends Error {}
export class DuplicatedRequest extends Error {}

let latestRequest = '';
let latestPromise: Promise<Response>;
// let latestResult: undefined;

// (north: number, east: number, south: number, west: number) {
async function search(boundingBox: number[]): Promise<Array<any>> {
  const [north, east, south, west] = boundingBox;
  // url.value = `${API}/search?filter[location]=${lat},${lng}&filter[radius]=${radius}`;
  // url.value = `${API}/search?filter[limit]=200`;
  const url = `${API}/search?filter[limit]=200&filter[bounding_box]=${west},${south},${east},${north}`;
  if (url === latestRequest) {
    if (latestPromise) await latestPromise; // same request
  }
  // if (url === latestRequest) {
  //     throw new DuplicatedRequest(); // same request
  // }

  console.log('Loading fresh results from', url);
  latestRequest = url;
//   latestPromise = fetch(url);
  const result = await fetch(url);
  if (url !== latestRequest) {
    console.info('Skipping results as request has been updated in the meantime.');
    throw new ExpiredRequest();
  }
  if (result.status !== 200) {
    console.warn (await result.text());
    throw new Error(`Failed to load results. Error ${result.status}.`)
  }

  const body = await result.json();
  if (body.total < 1 || body.data?.length < 1) {
    console.info('No results.');
    return [];
  }

  return body.data as Array<any>;
}

export function useSearchApi() { return {
    search,
}; }
