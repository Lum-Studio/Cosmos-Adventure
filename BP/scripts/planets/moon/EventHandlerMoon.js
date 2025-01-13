import { Moon } from "../dimension/Moon";
import { world, Player } from "@minecraft/server";

export class EventHandlerMoon {
    #subscribers = []; // Private field

    subscribe(fn, player) {
        // Ensure player is an instance of Player and has a valid location
        if (player instanceof Player && player.location && Moon.isOnLunar(player.location)) {
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
        // Check if the player's location is in the Moon
        if (Moon.isOnLunar(deadEntity.location)) {
            deadEntity.setDynamicProperty("cosmos:is_on_moon");
        }
    }
});

