import { z } from 'zod';

const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) return value;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : value;
    }
    return value;
};

export const FiniteNumberSchema = z.preprocess(toNumber, z.number().finite());

export const OrderBookSideSchema = z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .refine((s) => s === 'bid' || s === 'ask', { message: 'side must be bid|ask' });

export const OrderBookUpdateSchema = z
    .object({
        ticker: z.string().min(1),
        price: FiniteNumberSchema,
        side: OrderBookSideSchema,
        volume: FiniteNumberSchema,
    })
    .passthrough();

export const OrderBookUpdatesSchema = z.array(OrderBookUpdateSchema);

// Snapshot shape used by OrderBook._createSortedMap(rawOrderBook):
// { [ticker]: { bidVolumes: { [price]: qty }, askVolumes: { [price]: qty } } }
export const OrderBookVolumesSchema = z.record(z.string(), FiniteNumberSchema);

export const OrderBookSnapshotSchema = z.record(
    z.string(),
    z
        .object({
            bidVolumes: OrderBookVolumesSchema.optional().default({}),
            askVolumes: OrderBookVolumesSchema.optional().default({}),
        })
        .passthrough(),
);

export const PortfolioOrderSchema = z
    .object({
        orderId: z.string().or(z.number()).optional(),
        side: z.string().optional(),
        price: FiniteNumberSchema.optional(),
        volume: FiniteNumberSchema.optional(),
    })
    .passthrough();

export const PortfolioMessageSchema = z
    .object({
        balance: FiniteNumberSchema.optional(),
        pnl: FiniteNumberSchema.optional(),
        username: z.string().optional(),
        positions: z
            .record(
                z.string(),
                z
                    .object({
                        averagePrice: FiniteNumberSchema.optional(),
                        quantity: FiniteNumberSchema.optional(),
                    })
                    .passthrough(),
            )
            .optional(),
        Orders: z.record(z.string(), z.array(PortfolioOrderSchema)).optional(),
    })
    .passthrough();

export const OHLCSchema = z
    .object({
        open: FiniteNumberSchema,
        high: FiniteNumberSchema,
        low: FiniteNumberSchema,
        close: FiniteNumberSchema,
    })
    .passthrough();

export const ChartUpdateSchema = z.record(z.string(), OHLCSchema);
