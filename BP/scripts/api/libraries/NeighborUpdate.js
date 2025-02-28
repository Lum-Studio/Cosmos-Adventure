import { world, system } from "@minecraft/server";

/**
 * Event emitter.
 */
class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Registers a listener for the given event.
   * @param {string} event - The event name.
   * @param {Function} listener - The callback to invoke.
   */
  addListener(event, listener) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(listener);
  }

  /**
   * Unregisters a listener for the given event.
   * @param {string} event - The event name.
   * @param {Function} listener - The callback to remove.
   */
  removeListener(event, listener) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(listener);
    }
  }

  /**
   * Emits an event with the provided arguments.
   * @param {string} event - The event name.
   * @param {...any} args - Arguments to pass to listeners.
   */
  emit(event, ...args) {
    if (this._listeners.has(event)) {
      for (const listener of this._listeners.get(event)) {
        try {
          listener(...args);
        } catch (e) {
          console.error(`Error in event "${event}":`, e);
        }
      }
    }
  }
}

/**
 * Resolves a dimension from a provided value.
 * @private
 * @param {object|string|undefined} dim - A Dimension object or a dimension name (string).
 * @returns {{ instance: object, id: string }} An object containing the Dimension instance and its ID.
 */
function resolveDimension(dim) {
  if (typeof dim === "string") {
    return { instance: world.getDimension(dim), id: dim };
  } else if (dim && typeof dim === "object") {
    // If the dimension object has a 'name' property, use it; otherwise, default to "unknown".
    return { instance: dim, id: dim.name ? dim.name : "unknown" };
  }
  // Default dimension is overworld.
  return { instance: world.getDimension("overworld"), id: "overworld" };
}

/**
 * NeighborMonitor mimics a Forge-like onNeighborChanged callback for custom behaviors (e.g. custom fluids)
 * by monitoring the six face-adjacent neighbors of a block position.
 *
 * Watchers can be registered in any dimension. The scanning loop batches native API calls (getBlock)
 * and minimizes their usage by caching and debouncing changes, while processing cooperatively via system.runJob.
 *
 * The callback is invoked with the signature:
 *   onNeighborChanged(changedPos, newType, oldType, watcherPos, dimensionId)
 *
 * @example
 * // Register a neighbor listener in the Nether:
 * NeighborMonitor.onNeighborChanged(
 *   "fluidListener1",
 *   { x: 50, y: 70, z: 50 },
 *   (changedPos, newType, oldType, watcherPos, dimId) => {
 *     console.log(`In ${dimId}: Neighbor at ${JSON.stringify(changedPos)} of block ${JSON.stringify(watcherPos)} changed from ${oldType} to ${newType}`);
 *     // Custom behavior here...
 *   },
 *   "nether" // Dimension as string; alternatively, pass a Dimension object.
 * );
 *
 * // To remove the listener:
 * NeighborMonitor.removeNeighborChangedListener("fluidListener1");
 *
 * // When done with monitoring:
 * NeighborMonitor.dispose();
 */
class NeighborMonitor extends EventBus {
  // Static configuration and state.
  static _scanInterval = 10;
  static _debounceTicks = 2;
  static _currentTick = 0;
  /** @type {Map<string, Object>} */
  static _watchers = new Map(); // Map of watcherId -> { id, pos, dimension, dimensionId, neighbors, cache, callback }
  /** @type {Map<string, { pos: Object, type: string|null, lastTick: number }>} */
  static _globalCache = new Map();
  static _jobId = system.runJob(NeighborMonitor._scanLoop());

  /**
   * Internal generator: runs an endless scanning loop.
   * @private
   * @returns {Generator<void>}
   */
  static * _scanLoop() {
    while (true) {
      NeighborMonitor._currentTick++;
      yield* NeighborMonitor._scanAll();
      let ticks = NeighborMonitor._scanInterval;
      while (ticks-- > 0) {
        yield;
      }
    }
  }

  /**
   * Internal generator: scans all registered watchers for neighbor changes.
   * @private
   * @returns {Generator<void>}
   */
  static * _scanAll() {
    const coordToWatchers = new Map();
    // Aggregate neighbor coordinates per watcher (each key includes dimension).
    for (const watcher of NeighborMonitor._watchers.values()) {
      for (const nPos of watcher.neighbors) {
        const key = NeighborMonitor._coordKey(nPos, watcher.dimensionId);
        if (!coordToWatchers.has(key)) {
          coordToWatchers.set(key, []);
        }
        coordToWatchers.get(key).push({ watcher, oldEntry: watcher.cache.get(key) });
      }
    }
    // For each unique neighbor coordinate...
    for (const [key, watcherEntries] of coordToWatchers.entries()) {
      let globalEntry = NeighborMonitor._globalCache.get(key);
      if (!globalEntry || (NeighborMonitor._currentTick - globalEntry.lastTick) >= NeighborMonitor._debounceTicks) {
        // Use the first watcher's dimension to query.
        const { watcher } = watcherEntries[0];
        const samplePos = watcher.neighbors.find(nPos =>
          NeighborMonitor._coordKey(nPos, watcher.dimensionId) === key
        );
        let newType = null;
        try {
          const block = watcher.dimension.getBlock(samplePos);
          newType = block ? block.typeId : null;
        } catch (e) {
          newType = null;
        }
        globalEntry = { pos: samplePos, type: newType, lastTick: NeighborMonitor._currentTick };
        NeighborMonitor._globalCache.set(key, globalEntry);
      }
      // Process each watcher for this coordinate.
      for (const { watcher, oldEntry } of watcherEntries) {
        if (oldEntry && oldEntry.type !== globalEntry.type) {
          // Update watcher cache.
          watcher.cache.set(key, { type: globalEntry.type, lastTick: globalEntry.lastTick });
          try {
            // Invoke the callback: signature mimics Java's neighborChanged:
            // onNeighborChanged(changedPos, newType, oldType, watcherPos, dimensionId)
            watcher.callback(globalEntry.pos, globalEntry.type, oldEntry.type, watcher.pos, watcher.dimensionId);
          } catch (e) {
            console.error("Error in neighborChanged callback:", e);
          }
          // Emit a global neighborChange event.
          NeighborMonitor.prototype.emit.call(NeighborMonitor, "neighborChange", {
            watcherId: watcher.id,
            watcherPos: watcher.pos,
            neighborPos: globalEntry.pos,
            newType: globalEntry.type,
            oldType: oldEntry.type,
            dimensionId: watcher.dimensionId
          });
        }
      }
      yield;
    }
  }

  /**
   * Generates a unique key for a position in a specific dimension.
   * @private
   * @param {object} pos - The block position ({x, y, z}).
   * @param {string} dimId - The identifier of the dimension.
   * @returns {string} A unique key string.
   */
  static _coordKey(pos, dimId) {
    return `${dimId}:${pos.x},${pos.y},${pos.z}`;
  }

  /**
   * Returns the six face-adjacent neighbor positions for a block.
   * @private
   * @param {object} pos - The block position ({x, y, z}).
   * @returns {object[]} Array of neighbor positions.
   */
  static _getNeighbors(pos) {
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
   * Registers a neighbor listener for a given block position.
   *
   * @param {string} watcherId - Unique identifier for this listener.
   * @param {object} pos - The block position to monitor ({x, y, z}).
   * @param {Function} callback - Callback invoked on neighbor change, with signature:
   *        onNeighborChanged(changedPos, newType, oldType, watcherPos, dimensionId)
   * @param {object|string} [dimension] - Optional dimension (as a Dimension object or string). Defaults to "overworld".
   */
  static onNeighborChanged(watcherId, pos, callback, dimension) {
    const resolved = resolveDimension(dimension);
    const dimInstance = resolved.instance;
    const dimId = resolved.id;
    const neighbors = NeighborMonitor._getNeighbors(pos);
    const cache = new Map();
    // Prepopulate caches for each neighbor.
    for (const nPos of neighbors) {
      const key = NeighborMonitor._coordKey(nPos, dimId);
      let type = null;
      try {
        const block = dimInstance.getBlock(nPos);
        type = block ? block.typeId : null;
      } catch (e) {
        type = null;
      }
      cache.set(key, { type, lastTick: NeighborMonitor._currentTick });
      NeighborMonitor._globalCache.set(key, { pos: nPos, type, lastTick: NeighborMonitor._currentTick });
    }
    const watcher = { id: watcherId, pos, dimension: dimInstance, dimensionId: dimId, neighbors, cache, callback };
    NeighborMonitor._watchers.set(watcherId, watcher);
  }

  /**
   * Unregisters a neighbor listener by its watcher ID.
   * @param {string} watcherId - The ID of the listener to remove.
   */
  static removeNeighborChangedListener(watcherId) {
    NeighborMonitor._watchers.delete(watcherId);
  }

  /**
   * Stops the scanning job and clears internal caches and watchers.
   */
  static dispose() {
    if (NeighborMonitor._jobId !== undefined) {
      system.clearJob(NeighborMonitor._jobId);
      NeighborMonitor._jobId = undefined;
    }
    NeighborMonitor._watchers.clear();
    NeighborMonitor._globalCache.clear();
  }
}

// Mixin EventBus methods into NeighborMonitor’s prototype.
Object.assign(NeighborMonitor.prototype, EventBus.prototype);

export const NeighborMonitorAPI = NeighborMonitor;

/**
 * Registers a neighbor change listener for a block at the given position.
 *
 * @param {{x: number, y: number, z: number}} pos - The block position to monitor.
 * @param {Function} callback - Function called on neighbor change with signature:
 *        (changedPos, newType, oldType, blockPos, dimensionId)
 * @param {object|string} [dimension="overworld"] - Optional dimension (object or string). Defaults to "overworld".
 * @returns {Function} A function to unregister the listener.
 */
export function onNeighborChanged(pos, callback, dimension = "overworld") {
  // Use a simple stringified version of the position as a unique watcher ID.
  const watcherId = `neighbor:${pos.x},${pos.y},${pos.z}`;
  NeighborMonitorAPI.onNeighborChanged(watcherId, pos, callback, dimension);
  return () => {
    NeighborMonitorAPI.removeNeighborChangedListener(watcherId);
  };
}

