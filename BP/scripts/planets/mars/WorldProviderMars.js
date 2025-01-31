import { Planet } from "../dimension/GalacticraftPlanets.js";
import { Gravity } from "../dimension/Gravity.js";

let planet = Planet.get('mars')
planet.getPlayers().forEach(player => {
  new Gravity(player).set(planet.gravity)
})