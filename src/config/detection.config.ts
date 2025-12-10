export const DetectionConfig = {
  // WebSocket limits
  websocket: {
    maxConnectionsPerNode: 3,
    maxSubscriptionsPerConnection: 25,
    maxDetailSubscriptions: 8, // одновременно детальных
    reconnectBackoff: [200, 500, 1000, 2000, 5000], // ms
  },

  // Candidate filter (fast)
  candidateFilter: {
    volumeSpikeMin: 1.5, // минимум 2x рост
    priceChangeMin: 0.02, // минимум 3% движение
    minTurnover: 100000, // $200k оборот
  },

  // PumpScore weights
  scoring: {
    weights: {
      volume: 0.35,
      acceleration: 0.20,
      openInterest: 0.15,
      orderFlow: 0.20,
      liquidityDrop: 0.10,
    },
    thresholds: {
      strongAlert: 0.65, // 🔥🔥🔥
      watchlist: 0.40,   // 👀
      ignore: 0.50,
    },
  },

  // Detail subscription
  detailAnalysis: {
    subscriptionDuration: 60000, // 60s max
    minDuration: 10000, // 10s min
    extensionThreshold: 0.6, // продлить если score > 0.6
  },

  // Rate limits
  rateLimit: {
    subscribePerSecond: 5,
    requestsPerSecond: 10,
  },
};
