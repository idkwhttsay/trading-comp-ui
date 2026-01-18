export class SeqBuffer {
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.set = new Set();
        this.queue = [];
    }

    has(seq) {
        return this.set.has(seq);
    }

    add(seq) {
        if (this.set.has(seq)) return;
        this.set.add(seq);
        this.queue.push(seq);

        while (this.queue.length > this.maxSize) {
            const evicted = this.queue.shift();
            this.set.delete(evicted);
        }
    }

    clear() {
        this.set.clear();
        this.queue.length = 0;
    }
}
