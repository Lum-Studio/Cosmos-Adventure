import { world, system, Player } from "@minecraft/server"
import { start_celestial_selector } from "./celestial_selector"


/** 
 * Initiates the moon lander sequence for the player.
 * Disables certain input permissions, spawns and configures a lander entity,
 * and starts a flight loop to monitor landing conditions.
 *
 * @param {Player} player - The player that triggered the moon lander.
 */
export function moon_lander(player) {
    let speed = 0;
    // Disable specific input categories to restrict player control during lander flight.
    player.inputPermissions.setPermissionCategory(2, false);
    player.inputPermissions.setPermissionCategory(6, false);
    player.setProperty("cosmos:rotation_x", 90);
  
    // Spawn the lander entity near the player.
    let lander = player.dimension.spawnEntity("cosmos:lander", {
      x: player.location.x,
      y: 1,
      z: player.location.z,
    });
    lander.triggerEvent("cosmos:lander_gravity_disable");
    lander.teleport(player.location);
  
    // Set the lander's fuel level based on the player's dynamic property (expected to be a JSON array).
    try {
      const dimensionData = JSON.parse(player.getDynamicProperty("dimension"));
      lander.setDynamicProperty("fuel_level", dimensionData[1]);
    } catch (e) {
      console.error("Failed to parse player's dimension property:", e);
      lander.setDynamicProperty("fuel_level", 0);
    }
  
    // Apply a long-duration slow-falling effect and make the player ride the lander.
    lander.addEffect("slow_falling", 999999, { showParticles: false });
    lander.getComponent("minecraft:rideable").addRider(player);
    player.camera.setCamera("minecraft:follow_orbit", { radius: 20 });
    // Clear the player's dimension property.
    player.setDynamicProperty("dimension", undefined);
    lander.triggerEvent("cosmos:lander_gravity_enable");
  
    // Start a flight loop that monitors player input and lander conditions.
    let lander_flight = system.runInterval(() => {
      if (!player || !player.isValid()) {
        system.clearRun(lander_flight);
        return;
      }
      if (!lander || !lander.isValid()) {
        dismount(player);
        system.clearRun(lander_flight);
        return;
      }
      if (player.inputInfo.getButtonState("Jump") === "Pressed") {
        // Decrease speed when jump is pressed (capped at -1.0).
        speed = Math.min(speed - 0.022, -1.0);
        lander.addEffect("slow_falling", 3, { showParticles: false });
      } else {
        speed += 0.03;
      }
      // When the lander is low and its vertical velocity is zero.
      if (lander.location.y < 500 && lander.getVelocity().y === 0) {
        dismount(player);
        if (speed > 2) {
          // Excess speed triggers an explosion.
          lander.dimension.createExplosion(lander.location, 10, {
            causesFire: false,
            breaksBlocks: true,
          });
          lander.remove();
        }
        system.clearRun(lander_flight);
      }
    });
  }
  
  // Subscribe to player dimension change events to trigger the moon lander.
  world.afterEvents.playerDimensionChange.subscribe((data) => {
    if (!data.player.getDynamicProperty("dimension")) return;
    if (data.fromDimension.id !== "minecraft:overworld") return;
    try {
      const dimData = JSON.parse(data.player.getDynamicProperty("dimension"));
      if (dimData[0] === "Moon") {
        moon_lander(data.player);
      }
    } catch (e) {
      console.error("Error parsing player dimension data:", e);
    }
  });
  
  /**
   * Starts the countdown sequence before rocket liftoff.
   *
   * @param {Entity} rocket - The rocket entity.
   * @param {Player} player - The player controlling the rocket.
   */
  function start_countdown(rocket, player) {
    rocket.setDynamicProperty("active", true);
    player.inputPermissions.setPermissionCategory(2, false);
    let countdown = 20;
    const counter = system.runInterval(() => {
      if (!rocket || !rocket.isValid()) {
        system.clearRun(counter);
        return;
      }
      if (countdown > 1) {
        countdown--;
        player.onScreenDisplay.setTitle(
          "§c" + countdown,
          { fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 20 }
        );
      } else {
        world.sendMessage("Liftoff!");
        system.clearRun(counter);
        rocket_flight(rocket);
        break_pad(rocket);
      }
    }, 20);
  }
  
  /**
   * Clears the launch pad area beneath the rocket.
   *
   * @param {Entity} rocket - The rocket entity.
   */
  function break_pad(rocket) {
    if (!rocket || !rocket.isValid()) return;
    const {
      location: { x, y, z },
      dimension,
    } = rocket;
    world.gameRules.doTileDrops = false;
    dimension.runCommand(`fill ${x - 1} ${y} ${z - 1} ${x + 1} ${y} ${z + 1} air destroy`);
    world.gameRules.doTileDrops = true;
  }
  
  /**
   * Dismounts the player from the rocket and resets their properties.
   *
   * @param {Player} player - The player to dismount.
   */
  function dismount(player) {
    player.setProperty("cosmos:is_sitting", 0);
    player.setProperty("cosmos:rotation_x", 90);
    // Clear the dynamic property indicating the player is in a rocket.
    player.setDynamicProperty("in_the_rocket", undefined);
    player.onScreenDisplay.setTitle("");
    player.camera.clear();
    player.inputPermissions.setPermissionCategory(2, true);
    player.inputPermissions.setPermissionCategory(6, true);
  }
  
  /**
   * Computes new rotation values for the rocket based on the player's movement input.
   *
   * @param {Player} player - The player providing input.
   * @param {Entity} rocket - The rocket entity.
   * @returns {number[]} An array containing the new X rotation and Y rotation.
   */
  function rocket_rotation(player, rocket) {
    const x = Math.round(player.inputInfo.getMovementVector().x);
    const y = Math.round(player.inputInfo.getMovementVector().y);
    const currentRotationX = rocket.getProperty("cosmos:rotation_x");
    // Use parentheses to correctly apply the conditional adjustment.
    const rotationAdjustment =
      (x === 0 && y === 1)
        ? -0.7
        : (x === 0 && y === -1)
        ? 0.7
        : 0;
    let rotationX = currentRotationX + rotationAdjustment;
    // Clamp rotationX between 0 and 180.
    rotationX = rotationX > 180 ? 180 : rotationX < 0 ? 0 : rotationX;
    const rotationY = rocket.getRotation().y + ((x === 1 && y === 0) ? 1 : (x === -1 && y === 0) ? -1 : 0);
    return [rotationX, rotationY];
  }
  
  /**
   * Manages the rocket flight sequence by applying levitation and updating rotation and fuel.
   *
   * @param {Entity} rocket - The rocket entity.
   */
  function rocket_flight(rocket) {
    if (!rocket?.isValid()) return;
    rocket.addEffect("levitation", 2000, { showParticles: false });
    let t = 0;
    let v = 0;
    const a = 30;
    const b = 10;
    const flight = system.runInterval(() => {
      if (!rocket?.isValid() || rocket.getComponent("minecraft:rideable").getRiders().length === 0) {
        system.clearRun(flight);
        return;
      }
      const player = rocket.getComponent("minecraft:rideable").getRiders()[0];
      if (player.getDynamicProperty("in_celestial_selector")) return;
      t++;
      if (t === 40) {
        world.sendMessage("§7Do not save & quit or disconnect while flying the rocket or in the celestial selector.");
      }
      if (v >= 10) {
        rocket.setDynamicProperty("rocket_launched", true);
      }
      v = Math.floor(a * (1 - Math.pow(Math.E, -t / (20 * b))));
      rocket.addEffect("levitation", 2000, { showParticles: false, amplifier: v });
      const rotation = rocket_rotation(player, rocket);
      const fuel = rocket.getDynamicProperty("fuel_level") ?? 0;
      rocket.setRotation({ x: rocket.getRotation().x, y: rotation[1] });
      rocket.setProperty("cosmos:rotation_x", rotation[0]);
      rocket.setDynamicProperty("fuel_level", Math.max(0, fuel - 1));
    });
  }
  
  /**
   * Listens for entity removal events to dismount players riding rockets.
   */
  world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
    for (const player of world.getAllPlayers()) {
      if (player.getDynamicProperty("in_the_rocket") === removedEntityId) {
        dismount(player);
      }
    }
  });
  
  /**
   * Processes custom script events related to rocket behavior.
   */
  system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: rocket, message }) => {
    if (id !== "cosmos:rocket") return;
    // Only process for designated rocket tiers.
    if (!["cosmos:rocket_tier_1", "cosmos:rocket_tier_2", "cosmos:rocket_tier_3"].includes(rocket?.typeId))
      return;
    const rider = rocket.getComponent("minecraft:rideable")
      .getRiders()
      .find(rider => rider.typeId === "minecraft:player");
    if (message === "tick") {
      const active = rocket.getDynamicProperty("active");
      let fuel = rocket.getDynamicProperty("fuel_level") ?? 0;
      // Disable jump input and set sitting property for the rider.
      if (rider) {
        rider.inputPermissions.setPermissionCategory(6, false);
        rider.setProperty("cosmos:is_sitting", 1);
      }
      // Add camera shake if the rocket is active.
      if (rider && active) {
        rider.runCommand(`camerashake add @s 0.1 1`);
      }
      // Ignite the engine when the rider presses jump.
      if (rider?.inputInfo.getButtonState("Jump") === "Pressed") {
        if (rocket.getDynamicProperty("active")) return;
        let space_gear = {};
        try {
          space_gear = JSON.parse(rider.getDynamicProperty("space_gear") ?? "{}");
        } catch (e) {
          console.error("Error parsing space_gear property:", e);
        }
        if (fuel > 0 && (space_gear.parachute || rocket.getDynamicProperty("ready"))) {
          start_countdown(rocket, rider);
        } else if (fuel === 0) {
          rider.sendMessage("I'll need to load in some rocket fuel first!");
        } else {
          rider.sendMessage("You do not have a parachute.\nPress jump again to start the countdown.");
          rocket.setDynamicProperty("ready", true);
        }
      }
      // Set the camera and mark the rider as being in the rocket.
      if (rider && !rider.getDynamicProperty("in_the_rocket")) {
        rider.camera.setCamera("minecraft:follow_orbit", { radius: 20 });
        rider.setDynamicProperty("in_the_rocket", rocket.id);
        if (!active) {
          rider.onScreenDisplay.setTitle("§c20", {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 20000,
          });
        }
      }
      // Check after a short delay if the rider has dismounted.
      system.runTimeout(() => {
        if (!rocket?.isValid() || !rider) return;
        const ride_id = rider.getComponent("minecraft:riding")?.entityRidingOn?.id;
        if (ride_id !== rocket.id) {
          rocket.setDynamicProperty("ready", undefined);
          dismount(rider);
        }
      }, 20);
      // Create an explosion if the rocket has launched and its vertical velocity is zero.
      if (rocket.getDynamicProperty("rocket_launched") && rocket.getVelocity().y === 0) {
        rocket.dimension.createExplosion(rocket.location, 10, {
          causesFire: true,
          breaksBlocks: true,
        });
        rocket.remove();
      }
      // Trigger the celestial selector when the rocket reaches space.
      if (rocket && rocket.isValid() && active && rocket.location.y > 1200) {
        const current_rider = rocket.getComponent("minecraft:rideable")
          .getRiders()
          .find(rider => rider.typeId === "minecraft:player");
        if (current_rider && !rocket.getDynamicProperty("freezed")) {
          rocket.setDynamicProperty("freezed", true);
          start_celestial_selector(current_rider);
        }
      }
    }
  });
  