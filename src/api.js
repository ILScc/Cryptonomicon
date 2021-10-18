const API_KEY =
  "05b70e141ac3139ce1d7f82c858b450549bfa59a896f1b4782ba72a69e7bfafd";

const tickersHandlers = new Map();
const tickersToConvertFromBTCtoUSD = new Map();

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

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
    handleInvalidTicker(parameter);
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  if (convertCurrency === "BTC") {
    tickersToConvertFromBTCtoUSD.set(currency, newPrice);
    return;
  }
  if (currency === "BTC") {
    convertPrice(newPrice);
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

function handleInvalidTicker(parameter) {
  const invalidTicker = [...tickersHandlers.keys()].find(
    (t) => parameter.split("~")[2] === t
  );

  if (parameter.includes(`${invalidTicker}~BTC`)) {
    unsubscribeFromTickerOnWs(invalidTicker, "BTC");
    const invalidHandlers = tickersHandlers.get(invalidTicker) ?? [];
    invalidHandlers.forEach((fn) => fn(null));
    return;
  }

  if (invalidTicker) {
    subscribeToTickerOnWs("BTC", "USD");
    subscribeToTickerOnWs(invalidTicker, "BTC");
  }
}

function convertPrice(newPrice) {
  [...tickersToConvertFromBTCtoUSD.entries()].forEach(
    ([ticker, currentPrice]) => {
      const relativePrice = currentPrice * newPrice;
      const convertHandlers = tickersHandlers.get(ticker);
      convertHandlers.forEach((handler) => handler(relativePrice));
    }
  );
}

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
} // TODO: add flag to check current connection BTC - USD

function unsubscribeFromTickerOnWs(ticker, currency = "USD") {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~${currency}`],
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

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  if ([...tickersToConvertFromBTCtoUSD.keys()].includes(ticker)) {
    tickersToConvertFromBTCtoUSD.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, "BTC");
    return;
  }
  unsubscribeFromTickerOnWs(ticker);
};
