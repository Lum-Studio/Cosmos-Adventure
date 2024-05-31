#### Block:
- copy block.json to `BP/blocks`
- rename the file
- change the id
- edit the material_instances

#### Entity:
- copy entity.json to `BP/entites`
- rename the file
- change the id
- add families
- change inventory size (number of slots + number of ui display elements + 1 for data storage)

#### Visuals:
- move the needed textures from the assets folder to `RP/textures/blocks` or add your own assets
- for each texture add this to `RP\textures\terrain_texture.json`
  ```json
	"id": {
		"textures":"textures/blocks/texture"
	}
  ```
- change the id and texture

- add this to `RP/blocks.json`
```json
    "id": {
       "sound": "stone",
       "textures": {
          "up": "top",
          "down": "bottom",
          "north": "back",
          "east": "right",
          "west": "left",
          "south": "front"
       }
    }
```
- change the id
- change the textures

- add this to `RP/sounds.json`
```json
"cosmos:machine:id": {
	"events": {
		"death": { "sound": "none", "volume": 0 }
	}
}
```
- change the id

- add this to `RP\texts\en_US.lang`
  ```lang
	tile.cosmos:id.name=Name
	entity.cosmos:machine:id.name=Name
  ```
- change the id and Name

#### Define the machine
- add this to `BP/scripts/core/machines/AllMachineBlocks.js`
```js
	"id": {
		tileEntity: "cosmos:machine:id",
		ui: "§u§i§_§t§a§g",
		class: m.Class,
		lore: {slot: data, value0: 0, vaule1: 1...}, // data = index of the data slot; vlauen = index of the value in the item lore
	}
```
- replace id with the machine id
- replace Class with the machine class
- repace data with the index of the data slot
- add the values which can be accessed by other machines

#### Function:
- copy Class.js to `BP\scripts\core\machines\blocks`
- rename it
- rename the class in the 5th line
- edit the main function

- export your class to `BP\scripts\core\machines\index.js`
  ```js
  export * from './blocks/Class'
  ```

#### Recipes:
if the machine uses recipe:
- copy the recipes.js to `BP\scripts\recipes`
- rename it
- edit it
