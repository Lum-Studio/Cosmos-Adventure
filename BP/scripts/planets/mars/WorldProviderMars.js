import {  Player, world  } from "@minecraft/server";
import { Planet } from "../dimension/GalacticraftPlanets.js";


const the_end = world.getDimension('the_end');

/**
 * Mars class extending the Planet class
 */
export class Mars extends Planet {
    static range = {
        start: { x: 50000, z: -50000 },
        end: { x: 100000, z: -100000 }
    };

    constructor() {
        super({ name: 'Mars', range: Mars.range });
    }
}

export const MARS = the_end