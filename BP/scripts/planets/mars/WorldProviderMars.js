import { Planet } from "../dimension/GalacticraftPlanets.js";
import { system, world  } from "@minecraft/server";



let planet = Planet.getAll().find(planet => planet.isOnPlanet(player.location))

world.afterEvents.playerDimensionChange.subscribe())