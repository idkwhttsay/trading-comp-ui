export class SeqBuffer {
    private maxSize: number;
    private set: Set<number>;
    public queue: number[];

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.set = new Set<number>();
        this.queue = [];
    }

    has(seq: number) {
        return this.set.has(seq);
    }

    add(seq: number) {
        if (this.set.has(seq)) return;
        this.set.add(seq);
        this.queue.push(seq);

        while (this.queue.length > this.maxSize) {
            const evicted = this.queue.shift();
            if (typeof evicted === 'number') {
                this.set.delete(evicted);
            }
        }
    }

    clear() {
        this.set.clear();
        this.queue.length = 0;
    }
}
