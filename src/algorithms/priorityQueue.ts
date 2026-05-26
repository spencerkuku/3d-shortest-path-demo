export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  get size(): number {
    return this.items.length;
  }

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }

  dequeue(): T | undefined {
    if (this.items.length === 0) return undefined;
    const root = this.items[0].item;
    const last = this.items.pop();
    if (last && this.items.length > 0) {
      this.items[0] = last;
      this.sinkDown(0);
    }
    return root;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[parentIndex].priority <= this.items[index].priority) break;
      [this.items[parentIndex], this.items[index]] = [
        this.items[index],
        this.items[parentIndex]
      ];
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (
        left < this.items.length &&
        this.items[left].priority < this.items[smallest].priority
      ) {
        smallest = left;
      }
      if (
        right < this.items.length &&
        this.items[right].priority < this.items[smallest].priority
      ) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index]
      ];
      index = smallest;
    }
  }
}
