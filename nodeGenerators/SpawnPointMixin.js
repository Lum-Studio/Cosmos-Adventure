
// Save a reference to the original setSpawnPoint method.
const originalSetSpawnPoint = Entity.prototype.setSpawnPoint;

/**
 * Bedrock equivalent of a mixin
 * If the entity is in the End, it saves the spawn location and call and custom overwrite methpd
 * Otherwise, it calls the original setSpawnPoint method.
 *
 * @param {{Vec3}} location - The desired spawn coordinates.
 */
Entity.prototype.setSpawnPoint = function(location) {
  // Check if the entity is in the End dimension.
  if (this.dimension && this.dimension.id === "the_end") {
    // Save the spawn point 
    if (this.setDynamicProperty) {
      this.setDynamicProperty("customSpawnPoint", location);
    }
    // Force teleport the player to the location in the End.
    const endDimension = world.getDimension("the_end");
    this.teleport(location, endDimension, 0, 0);
  } else {
    // For non-End dimensions, call the original method.
    if (typeof originalSetSpawnPoint === "function") {
      originalSetSpawnPoint.call(this, location);
    }
  }
};

// Listen for player respawn events.
world.afterEvents.playerSpawn.subscribe(eventData => {
  const player = eventData.player;
  // Retrieve the custom spawn point saved as a dynamic property.
  const spawnLocation = player.getDynamicProperty("customSpawnPoint");
  if (spawnLocation) {
    const end = world.getDimension("the_end");
    // Teleport the player to the saved spawn location in the End.
    player.teleport(spawnLocation, end, 0, 0);
  }
});

