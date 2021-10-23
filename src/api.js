const API_KEY =
  "05b70e141ac3139ce1d7f82c858b450549bfa59a896f1b4782ba72a69e7bfafd";
const AGGREGATE_INDEX = "5";

const tickersHandlers = new Map();
const BTCtoUSDtickers = new Map();
const existingConnections = new Map();

function createWS() {
  const newSocket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
  );
  newSocket.addEventListener("message", (e) => {
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
      BTCtoUSDtickers.set(currency, newPrice);
      return;
    }
    if (currency === "BTC" && BTCtoUSDtickers.size) {
      convertPrice(newPrice);
    }
    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach((fn) => fn(newPrice));

    localStorage.setItem(currency, newPrice);
  });

  newSocket.onopen = () => {
    sessionStorage.setItem("sourcePage", true);
  };
  newSocket.onclose = () => {
    sessionStorage.removeItem("sourcePage");
  };
  return newSocket;
}

let socket = createWS();
const bc = new BroadcastChannel("cryptonomicon");

bc.onmessage = ({ data: { type, ticker, currency } }) => {
  if (type === "subscribe" && !tickersHandlers.has(ticker)) {
    subscribeToTickerOnWs(ticker, currency);
  }
  if (
    type === "unsubscribe" &&
    (!tickersHandlers.has(ticker) || !BTCtoUSDtickers.has(ticker))
  ) {
    unsubscribeFromTickerOnWs(ticker);
  }
  if (type === "Connection expired" && !sessionStorage.getItem("sourcePage")) {
    socket = createWS();
    [...existingConnections.keys()].forEach((connection) => {
      subscribeToTickerOnWs(connection);
    });
  }
};

window.addEventListener("beforeunload", () => {
  if (sessionStorage.getItem("sourcePage"))
    bc.postMessage({ type: "Connection expired" });
});

window.addEventListener("storage", ({ key: ticker, newValue: newPrice }) => {
  const handlers = tickersHandlers.get(ticker) ?? [];
  handlers.forEach((fn) => fn(+newPrice));
});

function handleInvalidTicker(parameter) {
  const invalidTickerIdx = 2;
  const invalidTicker = parameter.split("~")[invalidTickerIdx];

  if (parameter.includes(`${invalidTicker}~BTC`)) {
    const invalidHandlers = tickersHandlers.get(invalidTicker) ?? [];
    invalidHandlers.forEach((fn) => fn(null));
    localStorage.setItem(invalidTicker, null);
    return;
  }

  if (!existingConnections.has("BTC")) {
    subscribeToTickerOnWs("BTC", "USD");
  }
  subscribeToTickerOnWs(invalidTicker, "BTC");
}

function convertPrice(newPrice) {
  [...BTCtoUSDtickers.entries()].forEach(([ticker, currentPrice]) => {
    const convertedPrice = currentPrice * newPrice;
    const convertHandlers = tickersHandlers.get(ticker) ?? [];
    convertHandlers.forEach((handler) => handler(convertedPrice));
    localStorage.setItem(ticker, convertedPrice);
  });
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

function subscribeToTickerOnWs(ticker, currency = "USD") {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${currency}`],
  });
}

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
  existingConnections.set(ticker, currency);
  bc.postMessage({ type: "subscribe", ticker: ticker, currency: currency });
};

export const unsubscribeFromTicker = (ticker) => {
  if (ticker === "BTC" && BTCtoUSDtickers.size) {
    return;
  }
  if (BTCtoUSDtickers.get(ticker)) {
    BTCtoUSDtickers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, "BTC");
  }
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
  existingConnections.delete(ticker);
  localStorage.removeItem(ticker);
  bc.postMessage({ type: "unsubscribe", ticker: ticker });
};
