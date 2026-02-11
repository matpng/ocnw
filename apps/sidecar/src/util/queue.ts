/**
 * Per-user FIFO queue so that WhatsApp double-sends / webhook retries
 * don't interleave tool loops. In production use a durable queue.
 */
type Task<T> = () => Promise<T>;

const queues = new Map<string, Promise<any>>();

export function enqueue<T>(key: string, task: Task<T>): Promise<T> {
    const prev = queues.get(key) ?? Promise.resolve();
    const next = prev.then(task).catch(() => task()); // keep queue alive
    queues.set(key, next as any);
    return next;
}
