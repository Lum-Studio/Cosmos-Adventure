"use strict";

var _server = require("@minecraft/server");

var _Vector = require("../../api/libraries/Vector");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CavernousVine =
/*#__PURE__*/
function () {
  function CavernousVine(world) {
    _classCallCheck(this, CavernousVine);

    this.world = world;
    e;
  }

  _createClass(CavernousVine, [{
    key: "grabPlayer",
    value: function grabPlayer() {
      var players = this.world.getPlayers(); // Get all players

      var entities = this.world.getEntities(); // Get all entities
      // Apply knockback to each player

      players.forEach(function (player) {
        player.applyKnockback(0, 0, 0, 0.1); // Apply knockback to the player
      }); // Apply impulse to each entity

      entities.forEach(function (entity) {
        if (entity.typeId === 'minecraft:player') {} else {
          var vector = new _Vector.Vec3(0, 0.1, 0); // Define a vector for impulse

          entity.applyImpulse(vector); // Apply impulse to the entity
        }
      });
    }
  }, {
    key: "poisonPlayer",
    value: function poisonPlayer() {
      var players = this.world.getPlayers(); // Get all players

      players.forEach(function (player) {
        player.addEffect("minecraft:poison", 2); // Apply poison effect for 2 seconds
      });
    }
  }]);

  return CavernousVine;
}();

vineGrowth();

function growth(e) {
  var block = e.block; // Get the block's current location

  var _block$location = block.location,
      x = _block$location.x,
      y = _block$location.y,
      z = _block$location.z; // Get the block below the current block

  var blockBelow = block.dimension.getBlock({
    x: x,
    y: y - 1,
    z: z
  }); // Check if the block below is air

  if (blockBelow && blockBelow.typeId === 'minecraft:air') {
    // Set the current block type to cosmos:cavernous
    block.setType('cosmos:cavernous');
  }
}

_server.world.beforeEvents.worldInitialize.subscribe(function (_ref) {
  var blockComponentRegistry = _ref.blockComponentRegistry;
  blockComponentRegistry.registerCustomComponent('cosmos:cavernous_vine', {
    onTick: function onTick(_ref2) {
      var block = _ref2.block;
    },
    onRandomTick: function onRandomTick(_ref3) {
      var block = _ref3.block;
    }
  });
});
//# sourceMappingURL=cavernous_vine.dev.js.map
