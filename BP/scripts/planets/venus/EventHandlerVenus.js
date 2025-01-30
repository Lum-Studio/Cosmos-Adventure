import { Venus  } from "./Venus";
import { Player } from "@minecraft/server";

export class EventHandlerMoon {
    #subscribers = []; // Private field

    subscribe(fn, player) {
        // Ensure player is an instance of Player and has a valid location
        if (player instanceof Player && player.location && Venus.isOnVenus(player.location)) {
            this.#subscribers.push(fn);
        } else {
            console.warn("Player does not have a valid location or is not on the Moon.");
        }
    }

    trigger(eventData) {
        this.#subscribers.forEach((fn) => fn(eventData));
    }
}