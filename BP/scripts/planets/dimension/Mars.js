import {  Player, world  } from "@minecraft/server";
import { Vec3, vec3 } from "../../api/libraries/Vector.js"
import { the_end } from "../../api/utils.js";

const the_end = world.getDimension('the_end');
/**
 * Class containing methods relating to Mars
 */
class Mars {
    /**
     * Range of blocks in the end that Mars takes up
     */
    static range = { start: { x: -50000, z: -50000 }, end: { x: 100000, z: 100000 } };

    /**
     * Center block of Mars
     */
    static origin = { x: (this.range.start.x + this.range.end.x) / 2, z: (this.range.start.z + this.range.end.z) / 2 };

    /**
     * Checks whether a given location is on Mars
     * @param {import("@minecraft/server").Vector3} location location to check
     * @returns {boolean} Whether or not the location is on Mars
     */
    static isOnMars(location) {
        return this.range.start.x <= location.x && location.x <= this.range.end.x && this.range.start.z <= location.z && location.z <= this.range.end.z;
    }

    /**
     * Gets all entities in the Moon that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Entity[]} All entities matching the query
     */
    static getEntities(entityQueryOptions) {
        return the_end.getEntities(entityQueryOptions).filter((entity) => this.isOnMars(entity.location));
    }

    /**
     * Gets all players in the Moon that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Player[]} All players matching the query
     */
    static getPlayers(entityQueryOptions) {
        return the_end.getPlayers(entityQueryOptions).filter((entity) => this.isOnMars(entity.location));
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
     * Runs a command on Mars
     * @param {string} command Command to run
     * @returns {CommandResult} The result of the command
     */
    static run_command(command) {
        return the_end.run_command(command);
    }

    /**
     * Spawns an entity on Mars
     * @param {string} identifier Entity type to spawn
     * @param {Vec3} location Location to spawn entity
     * @returns {Entity} The spawned entity
     */
    static spawnEntity(identifier, location) {
        return the_end.spawnEntity(identifier, location);
    }

    /**
     * Spawns an item on Mars
     * @param {ItemStack} itemStack Item stack to spawn
     * @param {Vec3} location Location to spawn item
     * @returns {Entity} The spawned item entity
     */
    static spawnItem(itemStack, location) {
        return the_end.spawnItem(itemStack, location);
    }

    /**
     * Spawns a particle effect on Mars
     * @param {ItemStack} itemStack Particle to spawn
     * @param {Vec3} location Location to spawn particle
     * @param {MolangVariableMap} molangVariables optional varibles for this particle
     */
    static spawnParticle(effectName, location, molangVariables = {}) {
        return the_end.spawnParticle(effectName, location, molangVariables);
    }
    /**
     * get the player location on Mars
     * @param {Player} player optional varibles for this particle
     */
    static getPosition( player
    ) { {
        return Vec3.add(player.location, Vec3.from(-500000, 0, -500000));
   }}
}

export default Mars
