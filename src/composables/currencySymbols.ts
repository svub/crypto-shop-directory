const cache = new Map<string, string>();
async function image(currencyName: string) {
  const url = `https://api.coingecko.com/api/v3/search?query=${currencyName}`
  const promise = new Promise<string>(async (resolve, reject) => {
    if (cache.has(currencyName)) return resolve(cache.get(currencyName)!);

    const response = await fetch(url);
    if (response.status !== 200) return reject(`Request failed ${response.status}`);
    const json = await response.json()
    if (!json?.coins?.length) return reject(`No coins found for ${currencyName}`);

    const coin = json.coins[0];
    const image = coin.thumb; // also "large" available;
    cache.set(coin.id, image);
    cache.set(coin.name, image);
    cache.set(coin.symbol, image);

    resolve(image);
  });
  return promise;
}

export function useCurrencySymbols() { return {
  image,
}}
