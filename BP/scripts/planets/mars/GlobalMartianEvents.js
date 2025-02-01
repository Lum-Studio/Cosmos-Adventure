import { PlanetEventHandler  } from "../dimension/LevelOnJoin";
import { Planet } from "../dimension/GalacticraftPlanets";
import { Gravity } from "../dimension/Gravity";

const mars = Planet.get('mars');
const eventHandler = new PlanetEventHandler('mars');

eventHandler.onJoinLevel((player) => {
    // Get the player's current location
    const currentLocation = player.location;
    
    // Check if the player is not already on Mars
    if (!mars.isOnPlanet(currentLocation)) 
    // Apply gravity to the player on Mars
    new Gravity(player).set(mars.gravity);
});