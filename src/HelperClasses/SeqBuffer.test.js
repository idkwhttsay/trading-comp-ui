import { SeqBuffer } from "./SeqBuffer";

describe("SeqBuffer", () => {
    test("dedupes seqs", () => {
        const buf = new SeqBuffer(10);
        buf.add(1);
        buf.add(1);
        expect(buf.has(1)).toBe(true);
        expect(buf.queue.length).toBe(1);
    });

    test("evicts oldest entries when over capacity", () => {
        const buf = new SeqBuffer(2);
        buf.add(1);
        buf.add(2);
        buf.add(3);
        expect(buf.has(1)).toBe(false);
        expect(buf.has(2)).toBe(true);
        expect(buf.has(3)).toBe(true);
    });
});
