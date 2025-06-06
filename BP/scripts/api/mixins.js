import * as mc from "@minecraft/server";

const { world } = mc;

//Feel free to take out keys from these if you need any so it wont get deleted
//This is just to reduce unused prototypes
;['__quote', 'anchor', 'big', 'blink', 'bold',
    'fixed', 'fontcolor', 'fontsize', 'italics',
    'link', 'localeCompare', 'sub', 'sup', 'small',
    'strike', 'toLocaleLowerCase', 'toLocaleUpperCase'
].forEach(key => delete String.prototype[key]);

["decodeURI", "decodeURIComponent", "encodeURI",
    "encodeURIComponent", "escape", "unescape",
    "ArrayBuffer", "SharedArrayBuffer",
    "Uint8ClampedArray", "Int8Array", "Uint8Array",
    "Int16Array", "Uint16Array", "Int32Array",
    "Uint32Array", "BigInt64Array", "BigUint64Array",
    "Float32Array", "Float64Array", "print"
].forEach(key => delete globalThis[key]);


/**@typedef {<T extends {}, U>(target: T, source: T & {}) => T & U} MergeType */
/**
 * Originally from "ConMaster2112"; Modified by "Remember M9"
 * @type MergeType
 * @example give.js
 * ```js
 * mc.Player.prototype.give = function (item, amount) {
 *      this.runCommand(`give @s ${item} ${amount}`)
 * }
 * //this is similar implementation
 * Merge(mc.Player.prototype, {
 *      give(item, amount) {
 *          this.runCommand(`give @s ${item} ${amount}`)
 *      }
 * })
 * ```
 */
globalThis.Merge = (() => {
    const { defineProperties: a, getOwnPropertyDescriptors: b, getPrototypeOf: c, setPrototypeOf: z } = Object;
    return (origin, object, getObject = false) => {
        const prototypeOrigin = z(a({}, b(origin)), c(origin));
        z(object, prototypeOrigin);
        a(origin, b(object));
        return getObject && object;
    };
})();



//@ts-expect-error
Merge(mc.ItemStack.prototype, {

    decrementStack(decrementItemAmount = 1) {
        if (this.amount > decrementItemAmount) {
            this.amount = this.amount - decrementItemAmount;
            return this;
        } else return undefined;
    },

    incrementStack(incrementItemMax = 64, incrementItemAmount = 1) {
        if ((incrementItemMax === 64) ? this.amount < incrementItemMax : this.amount <= incrementItemMax) {
            this.amount = this.amount + incrementItemAmount;
        } return this;
    }

});


//@ts-expect-error
Merge(mc.Player.prototype, {

    give(item, amount = 1, data = 0) {
        world.gameRules.sendCommandFeedback &&= false;
        this.runCommand(`give @s ${item} ${amount} ${data}`);
        this.runCommand("stopsound @s random.pop");
        world.gameRules.sendCommandFeedback ||= true;
    }
});


//@ts-expect-error
Merge(mc.Block.prototype, {

    //WTF is this?
    getNeighbors(maxSearch = 27) {
        const directions = ["above", "north", "east", "west", "south", "below"]
        const connectedBlocks = []
        const visted = new Set();
        const queue = [this.location]
        while (connectedBlocks.length < maxSearch) {
            const loc = queue.pop();
            const hash = `${loc.x},${loc.y},${loc.z}`
            if (!visted.has(hash)) {
                visted.add(hash);
                try {
                    for (const dir of directions) {
                        const offsetBlock = this[dir]();
                        const newHash = `${offsetBlock.x},${offsetBlock.y},${offsetBlock.z}`
                        if (!visted.has(newHash)) {
                            visted.add(hash);
                            queue.push(offsetBlock.location);
                            connectedBlocks.push(offsetBlock)
                        }
                    }
                } catch (e) {
                    null//console.error(e, e.stack)
                }
            }
        } return connectedBlocks;
    },

    // returns an object eg: { north: Block, east: Block, west: Block, ...}
    four_neighbors(sides = ["north", "east", "west", "south"]) {
        const blocks = {}
        sides.forEach(side => {
            blocks[side] = this[side]()
        })
        return blocks
    },

    // returns an object eg: { above: Block, north: Block, east: Block, ...}
    six_neighbors() {
        return this.four_neighbors(["above", "north", "east", "west", "south", "below"])
    }

});


//@ts-expect-error
Merge(mc.World.prototype, {
    getDims(fn) {
        // dimension.getEntities returns a entity array, so flatMap to combine it into one array
        return ['overworld', 'nether', 'the_end'].flatMap(dim => {
            const dimension = this.getDimension(dim);
            return fn ? fn(dimension) : dimension
        })
    }
});



//@ts-expect-error
Merge(mc.Dimension.prototype, {

    stopSound(soundName, location) {
        return this.runCommand(
            `execute positioned ${location.x} ${location.y} ${location.z} run stopsound @a ${soundName}`
        );
    }

});

