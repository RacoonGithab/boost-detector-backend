/*
  Warnings:

  - A unique constraint covering the columns `[symbol,timestamp]` on the table `pump_events` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pump_events_symbol_timestamp_key" ON "pump_events"("symbol", "timestamp");
