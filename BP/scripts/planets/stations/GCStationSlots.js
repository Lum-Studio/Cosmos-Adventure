export { SpaceStationMatrix }

/**
 * SpaceStationMatrix Class for Handling Space Stations slots
 *
 * Maps a 50,000×50,000 block area into a fixed 10×10 grid of cells (each cell 5,000×5,000 blocks).
 * This results in exactly 100 possible cells.
 *
 * Each cell is stored in a Map with a key "rx,rz" where:
 *   rx = Math.floor(x / slotSize)
 *   rz = Math.floor(z / slotSize)
 *
 * Each cell object contains:
 *   - its grid indices (rx, rz)
 *   - its boundaries (minX, minZ, maxX, maxZ)
 *   - an arbitrary "data" object (for station-specific information)
 */
class SpaceStationMatrix {
    /**
     * @param {number} areaSize - Total area size (default: 50000 blocks).
     * @param {number} slotSize - Size of each cell (default: 5000 blocks).
     */
    constructor(areaSize = 50000, slotSize = 5000) {
      this.areaSize = areaSize;
      this.slotSize = slotSize;
      this.cols = Math.floor(areaSize / slotSize); // should be 10
      this.rows = Math.floor(areaSize / slotSize); // should be 10
      // Map to store cells; keys will be "rx,rz".
      this.map = new Map();
    }
  
    /**
     * Computes the grid indices for given world coordinates.
     * @param {number} x - World X coordinate.
     * @param {number} z - World Z coordinate.
     * @returns {{rx: number, rz: number}}
     */
    getGridIndices(x, z) {
      const rx = Math.floor(x / this.slotSize);
      const rz = Math.floor(z / this.slotSize);
      return { rx, rz };
    }
  
    /**
     * Generates a string key for the given grid indices.
     * @param {number} rx
     * @param {number} rz
     * @returns {string} The key in the form "rx,rz".
     */
    getKey(rx, rz) {
      return `${rx},${rz}`;
    }
  
    /**
     * Computes the boundaries for a cell given its grid indices.
     * @param {number} rx - Grid X index.
     * @param {number} rz - Grid Z index.
     * @returns {{minX: number, minZ: number, maxX: number, maxZ: number}}
     */
    getSlotBounds(rx, rz) {
      const minX = rx * this.slotSize;
      const minZ = rz * this.slotSize;
      const maxX = (rx + 1) * this.slotSize;
      const maxZ = (rz + 1) * this.slotSize;
      return { minX, minZ, maxX, maxZ };
    }
  
    /**
     * Adds (or retrieves) a station cell for the specified grid indices with optional data.
     * If the cell already exists, its data is updated.
     *
     * @param {number} rx - Grid X index (0 ≤ rx < 10).
     * @param {number} rz - Grid Z index (0 ≤ rz < 10).
     * @param {object} data - Arbitrary data to store with the station cell.
     * @returns {object} The station cell object.
     */
    addStation(rx, rz, data = {}) {
      const key = this.getKey(rx, rz);
      let cell = this.map.get(key);
      if (!cell) {
        const bounds = this.getSlotBounds(rx, rz);
        cell = {
          indices: { rx, rz },
          bounds,
          data: data,
          timestamp: Date.now()
        };
        this.map.set(key, cell);
      } else {
        // Optionally update existing cell data.
        cell.data = { ...cell.data, ...data };
        cell.timestamp = Date.now();
      }
      return cell;
    }
  
    /**
     * Removes the station cell at the specified grid indices.
     * @param {number} rx - Grid X index.
     * @param {number} rz - Grid Z index.
     */
    removeStation(rx, rz) {
      this.map.delete(this.getKey(rx, rz));
    }
  
    /**
     * Retrieves the station cell that covers the given world coordinates.
     * @param {number} x - World X coordinate.
     * @param {number} z - World Z coordinate.
     * @returns {object|null} The station cell object, or null if not allocated.
     */
    getStationByWorldCoord(x, z) {
      const { rx, rz } = this.getGridIndices(x, z);
      return this.map.get(this.getKey(rx, rz)) || null;
    }
  
    /**
     * Returns an array of all active station cells.
     * @returns {Array<object>}
     */
    listStations() {
      return Array.from(this.map.values());
    }
  
    /**
     * Clears all station cells.
     */
    clear() {
      this.map.clear();
    }
  }
  
  export default SpaceStationMatrix;
  