-- CreateTable
CREATE TABLE "pump_events" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pump_score" DECIMAL(5,3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "alert_sent" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actual_profit" DECIMAL(10,4),

    CONSTRAINT "pump_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_metrics" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volume" DECIMAL(20,2) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "open_interest" DECIMAL(20,2),

    CONSTRAINT "symbol_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_subscriptions" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "conn_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(5,3) NOT NULL,

    CONSTRAINT "active_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pump_events_symbol_timestamp_idx" ON "pump_events"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "symbol_metrics_symbol_timestamp_idx" ON "symbol_metrics"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "active_subscriptions_symbol_key" ON "active_subscriptions"("symbol");

-- CreateIndex
CREATE INDEX "active_subscriptions_expires_at_idx" ON "active_subscriptions"("expires_at");
