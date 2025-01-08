import {  Player, world  } from "@minecraft/server";
import { Vec3, vec3 } from "../../api/libraries/Vector.js"
import { the_end } from "../../api/utils.js";

const the_end = world.getDimension('the_end');
/**
 * Class containing methods relating to the Gaia dimension
 */
class Moon {
    /**
     * Range of blocks in the end that Gaia takes up
     */
    static range = { start: { x: 50000, z: 50000 }, end: { x: 100000, z: 100000 } };

    /**
     * Center block of the Moon
     */
    static origin = { x: (this.range.start.x + this.range.end.x) / 2, z: (this.range.start.z + this.range.end.z) / 2 };

    /**
     * Checks whether a given location is in the Moon
     * @param {import("@minecraft/server").Vector3} location location to check
     * @returns {boolean} Whether or not the location is in the Moon
     */
    static isInLunar(location) {
        return this.range.start.x <= location.x && location.x <= this.range.end.x && this.range.start.z <= location.z && location.z <= this.range.end.z;
    }

    /**
     * Gets all entities in the Moon that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Entity[]} All entities matching the query
     */
    static getEntities(entityQueryOptions) {
        return the_end.getEntities(entityQueryOptions).filter((entity) => this.isInLunar(entity.location));
    }

    /**
     * Gets all players in the Moon that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Player[]} All players matching the query
     */
    static getPlayers(entityQueryOptions) {
        return the_end.getPlayers(entityQueryOptions).filter((entity) => this.isInLunar(entity.location));
    }

    /**
     * Returns the block at the given location
     * @param {Vec3} location Location to get block from
     * @returns {Block} The block at the location
     */
    static getBlock(location) {
        return the_end.getBlock(location);
    }

    /**
     * Runs a command in the Moon
     * @param {string} command Command to run
     * @returns {CommandResult} The result of the command
     */
    static run_command(command) {
        return the_end.run_command(command);
    }

    /**
     * Spawns an entity in the Moon
     * @param {string} identifier Entity type to spawn
     * @param {Vec3} location Location to spawn entity
     * @returns {Entity} The spawned entity
     */
    static spawnEntity(identifier, location) {
        return the_end.spawnEntity(identifier, location);
    }

    /**
     * Spawns an item in Moon
     * @param {ItemStack} itemStack Item stack to spawn
     * @param {Vec3} location Location to spawn item
     * @returns {Entity} The spawned item entity
     */
    static spawnItem(itemStack, location) {
        return the_end.spawnItem(itemStack, location);
    }

    /**
     * Spawns a particle effect in the Moon
     * @param {ItemStack} itemStack Particle to spawn
     * @param {Vec3} location Location to spawn particle
     * @param {MolangVariableMap} molangVariables optional varibles for this particle
     */
    static spawnParticle(effectName, location, molangVariables = {}) {
        return the_end.spawnParticle(effectName, location, molangVariables);
    }
}

export default Moon
