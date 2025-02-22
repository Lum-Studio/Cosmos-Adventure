import { world  } from "@minecraft/server";

export { NeighborUpdate, neighborUpdate }
//This is kinda like Forge lol
// A dynamic API for tracking neighbor block updates using polling.
// Under the hood, it uses an internal tick counter for debouncing and batches getBlock calls.
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(...args);
        } catch (e) {
          console.error("Error in event", event, e);
        }
      }
    }
  }
}

export class BlockUpdateMonitor extends EventBus {
  /**
   * @param {object} world - Either a world container (with getDimension) or a Dimension instance.
   * @param {object} system - The system instance from @minecraft/server.
   * @param {number} [scanInterval=10] - Tick interval between scans.
   * @param {number} [debounceTicks=2] - Minimum ticks between re-querying the same coordinate.
   */
  constructor(world, system, scanInterval = 10, debounceTicks = 2) {
    super();
    this.system = system;
    // Resolve to a Dimension instance.
    if (typeof world.getDimension === "function") {
      this.dimension = world.getDimension("overworld");
    } else {
      this.dimension = world;
    }
    this.scanInterval = scanInterval;
    this.debounceTicks = debounceTicks;
    this.currentTick = 0;
    // Map of watcherId -> { pos, neighbors, cache: Map<coordKey, { type, lastTick }>, callback }
    this.watchers = new Map();
    // Global cache for neighbor queries: Map<coordKey, { pos, type, lastTick }>
    this.globalCache = new Map();
    // Start polling.
    this.system.runInterval(() => this.scanAll(), this.scanInterval);
  }

  /**
   * Converts a position object {x, y, z} to a unique key.
   * @param {object} pos
   * @returns {string}
   */
  coordKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
  }

  /**
   * Returns the 6 face-adjacent neighbor positions for a given block position.
   * @param {object} pos - {x, y, z}
   * @returns {object[]} Array of neighbor positions.
   */
  getNeighbors(pos) {
    const offsets = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    return offsets.map(off => ({
      x: pos.x + off.x,
      y: pos.y + off.y,
      z: pos.z + off.z
    }));
  }

  /**
   * Dynamically registers a watcher for a block position.
   * @param {string} watcherId - Unique identifier for this watcher.
   * @param {object} pos - The block position to monitor.
   * @param {function} callback - Called when a neighbor changes (signature: callback(changedPos, newType, oldType)).
   */
  registerWatcher(watcherId, pos, callback) {
    const neighbors = this.getNeighbors(pos);
    const cache = new Map();
    for (const nPos of neighbors) {
      const key = this.coordKey(nPos);
      try {
        const block = this.dimension.getBlock(nPos);
        const type = block ? block.typeId : null;
        cache.set(key, { type, lastTick: this.currentTick });
        this.globalCache.set(key, { pos: nPos, type, lastTick: this.currentTick });
      } catch (e) {
        cache.set(key, { type: null, lastTick: this.currentTick });
        this.globalCache.set(key, { pos: nPos, type: null, lastTick: this.currentTick });
      }
    }
    const watcher = { pos, neighbors, cache, callback };
    this.watchers.set(watcherId, watcher);
  }

  /**
   * Unregisters a watcher by its ID.
   * @param {string} watcherId
   */
  unregisterWatcher(watcherId) {
    this.watchers.delete(watcherId);
  }

  /**
   * Performs a batched scan for neighbor changes.
   */
  scanAll() {
    this.currentTick++;
    const coordToWatchers = new Map();
    // Aggregate neighbor coordinates from all watchers.
    for (const [id, watcher] of this.watchers) {
      for (const nPos of watcher.neighbors) {
        const key = this.coordKey(nPos);
        if (!coordToWatchers.has(key)) {
          coordToWatchers.set(key, []);
        }
        const oldEntry = watcher.cache.get(key);
        coordToWatchers.get(key).push({ watcher, oldEntry });
      }
    }
    // Process each unique neighbor coordinate.
    for (const [key, watcherEntries] of coordToWatchers) {
      let globalEntry = this.globalCache.get(key);
      if (!globalEntry || (this.currentTick - globalEntry.lastTick) >= this.debounceTicks) {
        const samplePos = watcherEntries[0].watcher.neighbors.find(nPos => this.coordKey(nPos) === key);
        try {
          const block = this.dimension.getBlock(samplePos);
          const newType = block ? block.typeId : null;
          globalEntry = { pos: samplePos, type: newType, lastTick: this.currentTick };
        } catch (e) {
          globalEntry = { pos: samplePos, type: null, lastTick: this.currentTick };
        }
        this.globalCache.set(key, globalEntry);
      }
      // Update each watcher for this coordinate.
      for (const { watcher, oldEntry } of watcherEntries) {
        const cached = watcher.cache.get(key);
        if (cached.type !== globalEntry.type) {
          watcher.cache.set(key, { type: globalEntry.type, lastTick: globalEntry.lastTick });
          try {
            watcher.callback(globalEntry.pos, globalEntry.type, cached.type);
          } catch (e) {
            console.error("Error in watcher callback:", e);
          }
          // Also emit a global event.
          this.emit("neighborChange", {
            watcherPos: watcher.pos,
            neighborPos: globalEntry.pos,
            newType: globalEntry.type,
            oldType: cached.type,
            watcherId: [...this.watchers.entries()].find(([id, w]) => w === watcher)?.[0] || null
          });
        }
      }
    }
  }
}


const neighborUpdate = new BlockUpdateMonitor()