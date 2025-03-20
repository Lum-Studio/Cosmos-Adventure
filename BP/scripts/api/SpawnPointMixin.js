import * as mc from "@minecraft/server";


// Listen for player respawn events.
mc.world.afterEvents.playerSpawn.subscribe(eventData => {
  //return when player joined the world
  if (eventData.initialSpawn) return;
  const player = eventData.player;
  // Retrieve the custom spawn point saved as a dynamic property.
  let spawnLocation = player.getDynamicProperty("customSpawnPoint");

  if (typeof spawnLocation !== "string") return;
  spawnLocation = JSON.parse(spawnLocation);
  //turn it into {x, y, z, dimension}
  spawnLocation.dimension = mc.world.getDimension(spawnLocation.dimension);
  // Teleport the player to the saved spawn location in the End.
  player.teleport(spawnLocation, spawnLocation);

});


export { }
