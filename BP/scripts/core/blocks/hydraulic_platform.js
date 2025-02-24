import { world, system, BlockPermutation, Block } from "@minecraft/server";

const { resolve } = BlockPermutation;
/**
 * Pre-resolved block permutations for the hydraulic platform.
 * @type {BlockPermutation[]}
 */
const hydraulicPlatformPermutations = [
  resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 0, "cosmos:is_full": true }),
  resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 1, "cosmos:is_full": true }),
  resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 2, "cosmos:is_full": true }),
  resolve("cosmos:hydraulic_platform", { "cosmos:rotation": 3, "cosmos:is_full": true })
];

/**
 * Initiates the motion of a hydraulic platform.
 * Applies an effect to the given entity, spawns a player seat,
 * teleports the player onto it, and then schedules an interval
 * to update the motion until the platform reaches its target.
 *
 * @param {Player} player - The player using the platform.
 * @param {Vector3} loc - The location where the seat should be spawned.
 * @param {Entity} entity - The moving platform entity.
 * @param {string} effect - The effect to apply (e.g. "levitation" or "slow_falling").
 */
function hydraulicPlatformMotion(player, loc, entity, effect) {
  system.runTimeout(() => {
    entity.addEffect(effect, 9999, { amplifier: 4, showParticles: false });
    const endLocation = entity.getDynamicProperty("end");
    const playerSeat = player.dimension.spawnEntity("cosmos:player_seat", loc);
    player.teleport(playerSeat.location);
    playerSeat.getComponent("minecraft:rideable").addRider(player);

    const motion = system.runInterval(() => {
      // Cache the current vertical difference once per tick.
      const yDiff = Math.abs(entity.location.y - endLocation.y);
      // Use a ternary operator to check against 0.2 regardless (the math is symmetric)
      if (
        !entity.isValid() ||
        !playerSeat.isValid() ||
        (yDiff <= 0.2)
      ) {
        // Revert open states for starting and ending blocks.
        const blocksStart = JSON.parse(entity.getDynamicProperty("blocksStart"));
        const blocksEnd = JSON.parse(entity.getDynamicProperty("blocksEnd"));
        blocksStart.forEach((loc) => {
          const b = entity.dimension.getBlock(loc);
          b.setPermutation(b.permutation.withState("cosmos:is_open", false));
        });
        blocksEnd.forEach((loc) => {
          const b = entity.dimension.getBlock(loc);
          b.setPermutation(b.permutation.withState("cosmos:is_open", false));
        });
        playerSeat?.clearVelocity();
        playerSeat?.getComponent("minecraft:rideable").ejectRider(player);
        playerSeat?.remove();
        entity?.remove();
        system.clearRun(motion);
        return;
      }
      // Ensure the player remains a rider
      const rideable = playerSeat.getComponent("minecraft:rideable");
      if (playerSeat.isValid() && !rideable.getRiders()[0]) {
        rideable.addRider(player);
      }
      playerSeat.clearVelocity();
      playerSeat.applyImpulse({ x: 0, y: entity.getVelocity().y, z: 0 });
    }, 1);
  }, 2);
}

/**
 * Determines the hydraulic platform block configuration based on neighboring blocks.
 *
 * It checks four different block groups around the given block to see if they are valid hydraulic
 * platform blocks (of type "cosmos:hydraulic_platform" and not full). When a valid configuration is
 * found, it updates their permutations with new states.
 *
 * @param {Block} block - The block to check.
 * @returns {number|undefined} A number (0–3) indicating the configuration, or undefined if none match.
 */
function getHydraulicPlatformBlock(block) {
  const blockH = {
    blockZero: [block.north(), block.west(), block.offset({ x: -1, y: 0, z: -1 })],
    blockOne: [block.west(), block.south(), block.offset({ x: -1, y: 0, z: 1 })],
    blockTwo: [block.north(), block.east(), block.offset({ x: 1, y: 0, z: -1 })],
    blockThree: [block.south(), block.east(), block.offset({ x: 1, y: 0, z: 1 })]
  };
  /**
   * Checks if every block in the group is a hydraulic platform and not full.
   * @param {Block[]} blocks 
   * @returns {boolean}
   */
  const areBlocksValid = (blocks) =>
    blocks.every(
      (b) => b && b.typeId === "cosmos:hydraulic_platform" && !b.permutation.getState("cosmos:is_full")
    );

  if (areBlocksValid(blockH.blockZero)) {
    blockH.blockZero[0].setPermutation(hydraulicPlatformPermutations[1]);
    blockH.blockZero[1].setPermutation(hydraulicPlatformPermutations[3]);
    blockH.blockZero[2].setPermutation(hydraulicPlatformPermutations[0]);
    return 0;
  } else if (areBlocksValid(blockH.blockOne)) {
    blockH.blockOne[0].setPermutation(hydraulicPlatformPermutations[0]);
    blockH.blockOne[1].setPermutation(hydraulicPlatformPermutations[2]);
    blockH.blockOne[2].setPermutation(hydraulicPlatformPermutations[3]);
    return 1;
  } else if (areBlocksValid(blockH.blockTwo)) {
    blockH.blockTwo[0].setPermutation(hydraulicPlatformPermutations[0]);
    blockH.blockTwo[1].setPermutation(hydraulicPlatformPermutations[2]);
    blockH.blockTwo[2].setPermutation(hydraulicPlatformPermutations[1]);
    return 2;
  } else if (areBlocksValid(blockH.blockThree)) {
    blockH.blockThree[0].setPermutation(hydraulicPlatformPermutations[3]);
    blockH.blockThree[1].setPermutation(hydraulicPlatformPermutations[1]);
    blockH.blockThree[2].setPermutation(hydraulicPlatformPermutations[2]);
    return 3;
  }
}

/**
 * Returns an array of blocks that form the platform based on the given rotation.
 *
 * @param {number} rot - The rotation (0–3) of the platform.
 * @param {Block} block - The main block of the platform.
 * @returns {Block[]} An array of 3 blocks that belong to the platform.
 */
function getPlatformBlocks(rot, block) {
  if (rot === 0)
    return [block.south(), block.east(), block.offset({ x: 1, y: 0, z: 1 })];
  else if (rot === 1)
    return [block.south(), block.west(), block.offset({ x: -1, y: 0, z: 1 })];
  else if (rot === 2)
    return [block.west(), block.north(), block.offset({ x: -1, y: 0, z: -1 })];
  else if (rot === 3)
    return [block.north(), block.east(), block.offset({ x: 1, y: 0, z: -1 })];
}

// Register a custom component for hydraulic platforms on world initialization.
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("cosmos:hydraulic_platform", {
    /**
     * Before placing the platform, determine its configuration.
     * @param {object} event - The block placement event.
     */
    beforeOnPlayerPlace(event) {
      // Map configuration: using string indexing '2130' to remap configuration numbers.
      const configIndex = "2130"[getHydraulicPlatformBlock(event.block)];
      event.permutationToPlace = hydraulicPlatformPermutations[configIndex].withState("cosmos:is_main", true);
    },
    /**
     * When a hydraulic platform is destroyed, reset associated blocks.
     * @param {object} event - The block destruction event.
     */
    onPlayerDestroy(event) {
      if (event.destroyedBlockPermutation.getState("cosmos:is_full")) {
        const rotation = event.destroyedBlockPermutation.getState("cosmos:rotation");
        const blockDestroyed = getPlatformBlocks(rotation, event.block);
        const nonFullMain = hydraulicPlatformPermutations[0]
          .withState("cosmos:is_full", false)
          .withState("cosmos:is_main", false);
        blockDestroyed.forEach((element) => element.setPermutation(nonFullMain));
      }
    },
    /**
     * Called every tick for blocks with this component.
     * Handles selection, jump/sneak detection, and platform motion.
     * @param {object} event - Contains the block and its dimension.
     */
    onTick({ block, dimension }) {
      if (!block.permutation.getState("cosmos:is_main")) return;

      // Cache frequently used values
      const rotation = block.permutation.getState("cosmos:rotation");
      const blocks = getPlatformBlocks(rotation, block);
      const { x, y, z } = block.center();
      // Calculate the center based on rotation.
      let center;
      switch (rotation) {
        case 0:
          center = { x: x + 0.5, y, z: z + 0.5 };
          break;
        case 1:
          center = { x: x - 0.5, y, z: z + 0.5 };
          break;
        case 2:
          center = { x: x - 0.5, y, z: z - 0.5 };
          break;
        case 3:
          center = { x: x + 0.5, y, z: z - 0.5 };
          break;
        default:
          center = { x, y, z };
      }
      // Retrieve players within 1 block above the center.
      const players = dimension.getPlayers({
        location: { x: center.x, y: center.y + 1, z: center.z },
        maxDistance: 1
      });

      if (players.length > 0) {
        // If not already selected, mark as selected.
        if (!block.permutation.getState("cosmos:is_selected")) {
          block.setPermutation(block.permutation.withState("cosmos:is_selected", true));
          blocks.forEach((b) =>
            b.setPermutation(b.permutation.withState("cosmos:is_selected", true))
          );
        }
        // Get blocks above and below via raycasts.
        const blockUp = dimension
          .getBlockFromRay({ x, y: y + 1, z }, { x: 0, y: 1, z: 0 }, { maxDistance: 15 })
          ?.block;
        const blockDown = dimension
          .getBlockFromRay({ x, y: y - 1, z }, { x: 0, y: -1, z: 0 }, { maxDistance: 15 })
          ?.block;
        const primaryPlayer = players[0];

        // Handle upward motion when the player is jumping.
        if (
          blockUp &&
          blockUp.typeId === "cosmos:hydraulic_platform" &&
          blockUp.permutation.getState("cosmos:is_full") &&
          blockUp.permutation.getState("cosmos:rotation") === rotation &&
          getPlatformBlocks(blockUp.permutation.getState("cosmos:rotation"), blockUp).every(
            (b) => b.below().isAir !== false
          )
        ) {
          if (primaryPlayer.isJumping && !block.permutation.getState("cosmos:is_open")) {
            // Open the platform.
            block.setPermutation(block.permutation.withState("cosmos:is_open", true));
            blocks.forEach((b) =>
              b.setPermutation(b.permutation.withState("cosmos:is_open", true))
            );
            const blocksUp = getPlatformBlocks(blockUp.permutation.getState("cosmos:rotation"), blockUp);
            blockUp.setPermutation(blockUp.permutation.withState("cosmos:is_open", true));
            blocksUp.forEach((b) =>
              b.setPermutation(b.permutation.withState("cosmos:is_open", true))
            );
            // Calculate center for the upper platform.
            let centerUp;
            switch (blockUp.permutation.getState("cosmos:rotation")) {
              case 0:
                centerUp = {
                  x: blockUp.center().x + 0.5,
                  y: blockUp.center().y,
                  z: blockUp.center().z + 0.5
                };
                break;
              case 1:
                centerUp = {
                  x: blockUp.center().x - 0.5,
                  y: blockUp.center().y,
                  z: blockUp.center().z + 0.5
                };
                break;
              case 2:
                centerUp = {
                  x: blockUp.center().x - 0.5,
                  y: blockUp.center().y,
                  z: blockUp.center().z - 0.5
                };
                break;
              case 3:
                centerUp = {
                  x: blockUp.center().x + 0.5,
                  y: blockUp.center().y,
                  z: blockUp.center().z - 0.5
                };
                break;
              default:
                centerUp = blockUp.center();
            }
            // Spawn a moving platform entity.
            const platform = dimension.spawnEntity("cosmos:hydraulic_platform", {
              x: center.x,
              y: center.y + 0.3,
              z: center.z
            });
            const blocksEdited = [
              blocks[0].location,
              blocks[1].location,
              blocks[2].location,
              block.location
            ];
            const blocksUpEdited = [
              blocksUp[0].location,
              blocksUp[1].location,
              blocksUp[2].location,
              blockUp.location
            ];
            platform.setDynamicProperty("blocksStart", JSON.stringify(blocksEdited));
            platform.setDynamicProperty("blocksEnd", JSON.stringify(blocksUpEdited));
            centerUp.y += 1;
            platform.setDynamicProperty("end", centerUp);
            hydraulicPlatformMotion(primaryPlayer, primaryPlayer.location, platform, "levitation");
          }
        }
        // Handle downward motion when the player is sneaking.
        if (
          blockDown &&
          blockDown.typeId === "cosmos:hydraulic_platform" &&
          blockDown.permutation.getState("cosmos:is_full") &&
          blockDown.permutation.getState("cosmos:rotation") === rotation &&
          getPlatformBlocks(blockDown.permutation.getState("cosmos:rotation"), blockDown).every(
            (b) => b.above().isAir !== false
          )
        ) {
          if (primaryPlayer.isSneaking && !block.permutation.getState("cosmos:is_open")) {
            block.setPermutation(block.permutation.withState("cosmos:is_open", true));
            blocks.forEach((b) =>
              b.setPermutation(b.permutation.withState("cosmos:is_open", true))
            );
            const blocksDown = getPlatformBlocks(blockDown.permutation.getState("cosmos:rotation"), blockDown);
            blockDown.setPermutation(blockDown.permutation.withState("cosmos:is_open", true));
            blocksDown.forEach((b) =>
              b.setPermutation(b.permutation.withState("cosmos:is_open", true))
            );
            let centerDown;
            switch (blockDown.permutation.getState("cosmos:rotation")) {
              case 0:
                centerDown = {
                  x: blockDown.center().x + 0.5,
                  y: blockDown.center().y,
                  z: blockDown.center().z + 0.5
                };
                break;
              case 1:
                centerDown = {
                  x: blockDown.center().x - 0.5,
                  y: blockDown.center().y,
                  z: blockDown.center().z + 0.5
                };
                break;
              case 2:
                centerDown = {
                  x: blockDown.center().x - 0.5,
                  y: blockDown.center().y,
                  z: blockDown.center().z - 0.5
                };
                break;
              case 3:
                centerDown = {
                  x: blockDown.center().x + 0.5,
                  y: blockDown.center().y,
                  z: blockDown.center().z - 0.5
                };
                break;
              default:
                centerDown = blockDown.center();
            }
            const platform = dimension.spawnEntity("cosmos:hydraulic_platform", {
              x: center.x,
              y: center.y + 0.2,
              z: center.z
            });
            const blocksEdited = [
              blocks[0].location,
              blocks[1].location,
              blocks[2].location,
              block.location
            ];
            const blocksDownEdited = [
              blocksDown[0].location,
              blocksDown[1].location,
              blocksDown[2].location,
              blockDown.location
            ];
            platform.setDynamicProperty("blocksStart", JSON.stringify(blocksEdited));
            platform.setDynamicProperty("blocksEnd", JSON.stringify(blocksDownEdited));
            platform.setDynamicProperty("end", { x: centerDown.x, y: centerDown.y - 1.4, z: centerDown.z });
            hydraulicPlatformMotion(
              primaryPlayer,
              { x: primaryPlayer.location.x, y: primaryPlayer.location.y, z: primaryPlayer.location.z },
              platform,
              "slow_falling"
            );
          }
        }
      } else if (players.length === 0 && block.permutation.getState("cosmos:is_selected")) {
        block.setPermutation(block.permutation.withState("cosmos:is_selected", false));
        blocks.forEach((b) =>
          b.setPermutation(b.permutation.withState("cosmos:is_selected", false))
        );
      }
    }
  });
});
