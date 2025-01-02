import { MachineBlockEntity } from "./MachineBlockEntity";
/**
 * Handles the management of machine instances in various dimensions.
 */
class MachineInstancesHandler {
    constructor() {
        // this map stores the machine instances in the form of: [`d${Dimension}x${X}y${Y}z${Z}`, MachineBlockEntity]
        this.instances = new Map()
    }

    /**
     * Adds a machine instance to a specific dimension at the provided location.
     * @param {Dimension} dimension - The dimension to add the instance to.
     * @param {Vector3} location - The location to add the instance at.
     * @param {MachineBlockEntity} instance - The instance to add.
     */
    add(dimension, location, instance) {
        const locationString = `d${dimension.id}x${location.x}y${location.y}z${location.z}`;
        if (this.instances.has(locationString)) return
        this.instances.set(locationString, instance)
    }

    /**
     * Removes a machine instance by its dimension and location.
     * @param {Dimension} dimension - The dimension to remove the instance from.
     * @param {Vector3} location - The location of the instance to remove.
     */
    destroy(dimension, location) {
        this.instances.delete(`d${dimension.id}x${location.x}y${location.y}z${location.z}`)
    }

    /**
     * Retrieves a machine instance using its dimension location.
     * @param {Dimension} dimension - The dimension to get the instance from.
     * @param {Vector3} location - The location of the instance to get.
     * @returns {MachineBlockEntity|undefined} The found machine instance.
     */
    get(dimension, location) {
        return this.instances.get(`d${dimension.id}x${location.x}y${location.y}z${location.z}`)
    }
}

/**
 * Singleton instance of MachineInstancesHandler class.
 */
const MachineInstances = new MachineInstancesHandler();

export { MachineInstances };
