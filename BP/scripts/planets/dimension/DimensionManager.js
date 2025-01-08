import { Player, system, world } from "@minecraft/server"
//this is some useless stuff
export class MoonCoordinate {
    static #locationMap = new Map(player.location);

    constructor(player) {
        this.player = player;
    }

    static adjustCoordinates(x, z) {
        return {
            adjustedX: ((x - 50000)),
            adjustedZ: ((z - 50000))
        };
    }

    updateCoordinates() {
        const { name, location } = this.player;
        const locationMap = MoonCoordinate.#locationMap;

        // Retrieve previous location or initialize with current location
        const prevLocation = locationMap.get(name)?.current;

        // Determine movement direction and adjust coordinates
        let adjustedX = 0;
        let adjustedZ = 0;

        if (location.x > prevLocation.x) {
            adjustedX = 1; // Move forward in x direction
        } else if (location.x < prevLocation.x) {
            adjustedX = -1; // Move backward in x direction
        }

        if (location.z > prevLocation.z) {
            adjustedZ = 1; // Move forward in z direction
        } else if (location.z < prevLocation.z) {
            adjustedZ = -1; // Move backward in z direction
        }

        // Update coordinates based on adjustments
        let current = { ...prevLocation };
        current.x += adjustedX;
        current.z += adjustedZ;
        current.y = location.y; // Update y-coordinate

        locationMap.set(name, { current: Vec3.round(current) });

        // Retrieve current location data
        const currentLocation = locationMap.get(name)?.current;

        // Prepare coordinate string for display
        const coordString = isNaN(currentLocation?.x) || isNaN(currentLocation?.z)
            ? "Loading Coordinates..."
            : `x: ${currentLocation.x} y: ${currentLocation.y} z: ${currentLocation.z}`;

        // Update player display with coordinates
        this.player.onScreenDisplay.setActionBar(coordString);
    }

    get coord() {
        const currentLocation = CoordinateDisplay.#locationMap.get(this.player.name)?.current;
        return currentLocation ? { x: currentLocation.x, y: currentLocation.y, z: currentLocation.z } : null;
    }
}
