"use strict";

var _server = require("@minecraft/server");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EnchantDeshPickaxe =
/*#__PURE__*/
function () {
  function EnchantDeshPickaxe(player) {
    _classCallCheck(this, EnchantDeshPickaxe);

    this.player = player;
  }

  _createClass(EnchantDeshPickaxe, null, [{
    key: "enchant",
    value: function enchant() {
      var inv = this.player.getComponent("inventory").container;
      var item = inv.getItem(this.player.selectedSlotIndex);

      if (item && item.typeId === "cosmos:desh_pickaxe") {
        var enchComp = item.getComponent('enchantable');

        if (!enchComp) {
          console.log("The selected item is not enchantable.");
          return; // Exit if the item is not enchantable
        }

        var enchantment = {
          type: new _server.EnchantmentType('silk_touch'),
          level: 1
        };
        enchComp.addEnchantment(enchantment);
        inv.setItem(this.player.selectedSlotIndex, item);
      }
    }
  }]);

  return EnchantDeshPickaxe;
}();

_server.world.beforeEvents.worldInitialize.subscribe(function (_ref) {
  var itemComponentRegistry = _ref.itemComponentRegistry;
  itemComponentRegistry.registerCustomComponent('cosmos:enchant_desh', {
    onPlayerDestroy: function onPlayerDestroy(_ref2) {
      var block = _ref2.block;
      EnchantDeshPickaxe.enchant(block);
    }
  });
});
//# sourceMappingURL=desh_pickaxe.dev.js.map
