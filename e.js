class Block {
    constructor(x, y, z) {
        this.location = { x, y, z };
    }

    above() {
        return new Block(this.location.x, this.location.y + 1, this.location.z);
    }

    north() {
        return new Block(this.location.x, this.location.y, this.location.z - 1);
    }

    east() {
        return new Block(this.location.x + 1, this.location.y, this.location.z);
    }

    west() {
        return new Block(this.location.x - 1, this.location.y, this.location.z);
    }

    south() {
        return new Block(this.location.x, this.location.y, this.location.z + 1);
    }

    below() {
        return new Block(this.location.x, this.location.y - 1, this.location.z);
    }

    getNeighbors(maxSearch = 27) {
        const directions = ["above", "north", "east", "west", "south", "below"];
        const connectedBlocks = [];
        const visited = new Set();
        const queue = [this.location];

        while (connectedBlocks.length <= maxSearch) {
            const loc = queue.pop();
            const hash = `${loc.x},${loc.y},${loc.z}`;

            if (!visited.has(hash)) {
                visited.add(hash);

                try {
                    for (const dir of directions) {
                        const offsetBlock = this[dir]();
                        console.warn(offsetBlock)
                        const newHash = `${offsetBlock.location.x},${offsetBlock.location.y},${offsetBlock.location.z}`;

                        if (!visited.has(newHash)) {
                            visited.add(newHash);
                            queue.push(offsetBlock.location);
                            connectedBlocks.push(offsetBlock);
                        }
                    }
                } catch (e) {
                    console.error('Their was a error', e.stack);
                }
            }
        }

        return connectedBlocks;
    }
}

// Example usage:
const myBlock = new Block(0, 0, 0);
const neighbors = myBlock.getNeighbors(6); // Adjust maxSearch if needed
console.log(neighbors);
