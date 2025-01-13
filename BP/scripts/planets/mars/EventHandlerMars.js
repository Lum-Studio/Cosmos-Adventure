import { Mars } from "../dimension/Mars";
import { world, Player } from "@minecraft/server";

export class EventHandlerMars {
    #subscribers = []; // Private field

    subscribe(fn, player) {
        // Ensure player is an instance of Player and has a valid location
        if (player instanceof Player && player.location && Mars.isOnMars(player.location)) {
            this.#subscribers.push(fn);
        } else {
            console.warn("Player does not have a valid location or is not on the Moon.");
        }
    }

    trigger(eventData) {
        this.#subscribers.forEach((fn) => fn(eventData));
    }
}

//Set the spawn point at Martian world center
world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource: { damagingEntity, damagingProjectile, cause } }) => {
    if (deadEntity instanceof Player) {
        // Check if the player's location is on Mars
        if (Mars.isOnMars(deadEntity.location)) {
            deadEntity.setDynamicProperty("cosmos:on_mars");
        }
    }
});