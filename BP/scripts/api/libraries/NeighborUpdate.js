import { system  } from "@minecraft/server";

export { NeighborUpdate, neighborUpdate }


export class NeighborUpdate {
    /**
     * @param {object} worldOrContainer - Either a world object with getDimension() or directly a Dimension instance.
     * @param {object} system - The system instance (from @minecraft/server)
     * @param {number} [scanInterval=10] - Tick interval between scans.
     * @param {number} [debounceTicks=2] - Minimum ticks between re-querying the same coordinate.
     */
    constructor(worldOrContainer, system, scanInterval = 10, debounceTicks = 2) {
      this.system = system;
      // Determine if the passed object has getDimension (i.e. it's a world container)
      if (typeof worldOrContainer.getDimension === "function") {
        // Use the "overworld" dimension by default.
        this.dimension = worldOrContainer.getDimension("overworld");
      } else {
        // Assume it's already a Dimension instance.
        this.dimension = worldOrContainer;
      }
      this.scanInterval = scanInterval;
      this.debounceTicks = debounceTicks;
      // Each watcher: { pos, neighbors, cache: Map<coordKey, { type, lastUpdated }>, callback }
      this.watchers = new Set();
      // Global cache for neighbor queries: Map<coordKey, { pos, type, lastUpdated }>
      this.globalCache = new Map();
      // Start periodic scanning
      this.system.runInterval(() => this.scanAll(), this.scanInterval);
    }
  
    /**
     * Registers a block position to watch.
     * @param {object} pos - The block position to watch, e.g. { x, y, z }.
     * @param {function} callback - Called when any neighbor changes; signature: callback(changedPos, newType, oldType).
     * @returns {object} The watcher object.
     */
    addWatcher(pos, callback) {
      const neighbors = this.getNeighbors(pos);
      const cache = new Map();
      for (const nPos of neighbors) {
        const key = this.coordKey(nPos);
        let entry = this.globalCache.get(key);
        if (!entry) {
          try {
            const block = this.dimension.getBlock(nPos);
            const typeId = block ? block.typeId : null;
            entry = { pos: nPos, type: typeId, lastUpdated: Date.now() };
            this.globalCache.set(key, entry);
          } catch (e) {
            // Block may be in an unloaded chunk; treat as null.
            entry = { pos: nPos, type: null, lastUpdated: Date.now() };
            this.globalCache.set(key, entry);
          }
        }
        cache.set(key, { type: entry.type, lastUpdated: entry.lastUpdated });
      }
      const watcher = { pos, neighbors, cache, callback };
      this.watchers.add(watcher);
      return watcher;
    }
  
    /**
     * Removes a watcher.
     * @param {object} watcher - The watcher object returned by addWatcher.
     */
    removeWatcher(watcher) {
      this.watchers.delete(watcher);
    }
  
    /**
     * Returns the 6 face-adjacent neighbor positions for a block.
     * @param {object} pos - A position object { x, y, z }.
     * @returns {object[]} An array of neighbor positions.
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
     * Converts a position to a unique string key.
     * @param {object} pos - The position { x, y, z }.
     * @returns {string} e.g. "10,64,10"
     */
    coordKey(pos) {
      return `${pos.x},${pos.y},${pos.z}`;
    }
  
    /**
     * Performs a batched scan for neighbor changes using internal memoization.
     */
    scanAll() {
      const now = Date.now();
      // Map of coordinate key => array of { watcher, oldEntry }
      const coordToWatchers = new Map();
  
      // Aggregate neighbor coordinates from all watchers.
      for (const watcher of this.watchers) {
        for (const nPos of watcher.neighbors) {
          const key = this.coordKey(nPos);
          if (!coordToWatchers.has(key)) {
            coordToWatchers.set(key, []);
          }
          const oldEntry = watcher.cache.get(key);
          coordToWatchers.get(key).push({ watcher, oldEntry });
        }
      }
      // Process each unique coordinate.
      for (const [key, watcherEntries] of coordToWatchers) {
        let globalEntry = this.globalCache.get(key);
        // Only re-query if enough time has passed (approx. 50ms per tick)
        if (!globalEntry || (now - globalEntry.lastUpdated) >= (this.debounceTicks * 50)) {
          const pos = watcherEntries[0].watcher.neighbors.find(nPos => this.coordKey(nPos) === key);
          try {
            const block = this.dimension.getBlock(pos);
            const newType = block ? block.typeId : null;
            globalEntry = { pos, type: newType, lastUpdated: now };
          } catch (e) {
            // If block cannot be retrieved (chunk unloaded, etc.), assume null.
            globalEntry = { pos, type: null, lastUpdated: now };
          }
          this.globalCache.set(key, globalEntry);
        }
        // Update each watcher for this coordinate.
        for (const { watcher, oldEntry } of watcherEntries) {
          const cached = watcher.cache.get(key);
          if (cached.type !== globalEntry.type) {
            watcher.cache.set(key, { type: globalEntry.type, lastUpdated: globalEntry.lastUpdated });
            try {
              watcher.callback(globalEntry.pos, globalEntry.type, cached.type);
            } catch (e) {
              console.error("NeighborUpdate callback error:", e);
            }
          }
        }
      }
    }
  }
  
const neighborUpdate = new NeighborUpdate()