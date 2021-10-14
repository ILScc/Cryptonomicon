const API_KEY =
  "05b70e141ac3139ce1d7f82c858b450549bfa59a896f1b4782ba72a69e7bfafd";

const tickersHandlers = new Map();

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

// function getBTC_USDPrice(invalidTicker, currency, convertCurrency, newPrice) {
//   subscribeToTickerOnWs("BTC", "USD");
//   subscribeToTickerOnWs(invalidTicker, "BTC");
//   let BTC_USDrate = null;
//   let invalidTicker_USDrate = null;
//   if (currency === "BTC" && convertCurrency === "USD") {
//     BTC_USDrate = newPrice;
//   }
//   if (currency === invalidTicker && convertCurrency === "BTC") {
//     invalidTicker_USDrate = newPrice;
//   }
//   return BTC_USDrate * invalidTicker_USDrate;
// }

const AGGREGATE_INDEX = "5";
const tickersToConvertFromBTCtoUSD = [];

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    TOSYMBOL: convertCurrency,
    PRICE: newPrice,
    MESSAGE: message,
    PARAMETER: parameter,
  } = JSON.parse(e.data);

  if (message === "INVALID_SUB") {
    const invalidTicker = [...tickersHandlers.keys()].find((t) =>
      parameter.split("~").find((tickerName) => tickerName === t)
    );
    if (invalidTicker !== "BTC") {
      subscribeToTickerOnWs("BTC", "USD");
      subscribeToTickerOnWs(invalidTicker, "BTC");
    }
    const invalidHandlers = tickersHandlers.get(invalidTicker);
    invalidHandlers.forEach((fn) => fn(null));
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  if (convertCurrency === "BTC") {
    tickersToConvertFromBTCtoUSD.push([currency, newPrice]);
  }
  if (currency === "BTC") {
    tickersToConvertFromBTCtoUSD.forEach(([ticker, currentPrice]) => {
      const newHandlers = tickersHandlers.get(ticker);
      newHandlers.forEach((handler) => handler(newPrice * currentPrice));
    });
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker, currency) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${currency}`],
  });
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

export const loadAllCoins = async () => {
  const coinsData = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );
  const allCoins = await coinsData.json();
  return allCoins.Data;
};

export const subscribeToTicker = (ticker, currency, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker, currency);
};

export const unsubscribeFromTicker = (ticker, currency) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker, currency);
};
