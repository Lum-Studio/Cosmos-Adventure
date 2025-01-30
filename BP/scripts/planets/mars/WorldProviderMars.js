import { Planet } from "../dimension/GalacticraftPlanets.js";
import { system, world  } from "@minecraft/server";
import { Gravity } from "../dimension/Gravity.js";

let planet = Planet.get('mars')
planet.getPlayers().forEach(player => {
  new Gravity(player).set(planet.gravity)
})