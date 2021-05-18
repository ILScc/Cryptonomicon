const API_KEY =
  "05b70e141ac3139ce1d7f82c858b450549bfa59a896f1b4782ba72a69e7bfafd";
const tickersHandlers = new Map();

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", (e) => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );
  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
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

function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

export const loadAllCoins = () => {
  const coinsData = fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );
  console.log(coinsData);
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
};
