import { ActionFormData} from "@minecraft/server-ui" ;
import { world, system } from "@minecraft/server" ;

const overworld = world.getDimension('overworld');
const rocket_tier = 3;

function set_planet_locations() {
	const middle = {x:200, y:101};
	for (let planet of Object.keys(solar_system)) {
		if (planet == "Asteroids" || planet == "Sol") continue;
		const tick = system.currentTick/20;
		const speed = -360/solar_system[planet].turn
		const angle = (tick * speed - solar_system[planet].init_angle) % 360
		const coods = angle_to_vector(angle, solar_system[planet].distance, middle);
		solar_system[planet].x = coods.x
		solar_system[planet].y = coods.y
	}
}
function set_asteroids_location() {
	const middle = {x:200, y:101};
	const random_angle = Math.random() * 360;
	const coods = angle_to_vector(random_angle, solar_system.Asteroids.distance, middle);
	solar_system.Asteroids.x = coods.x
	solar_system.Asteroids.y = coods.y
}
function set_moon_location() {
	const middle = {x:161, y:81}
	let time = 3 * (world.getTimeOfDay() + 12000) / 200;
	const {x, y} = angle_to_vector(-time, overworld_moon.distance, middle);
	overworld_moon.x = x;
	overworld_moon.y = y;
}
function set_station_location() {
	const middle = {x:97, y:49};
	let time = (3 * (world.getTimeOfDay() + 12000) / 200) - 120;
	const {x, y} = angle_to_vector(-time, overworld_station.distance, middle);
	overworld_station.x = x;
	overworld_station.y = y;
}


function read_inventory(player) {
	if (world.getPlayers({gameMode: "creative", name: player.nameTag}).length == 1) return '§t§t§t§t'
	const inventory = player.getComponent("inventory").container
	const items = []
	for (let item = 0; item < inventory.size; item++) {
		if (inventory.getItem(item) == undefined) {continue};
		items.push({id: inventory.getItem(item).typeId, amount: inventory.getItem(item).amount})
	}
	let results = ['§','f','§','f','§','f','§','f'];
	const materials = [0, 0, 0, 0];
	items.forEach((item)=> {
		if (item.id == 'cosmos:aluminum_ingot') {materials[0] += item.amount};
		if (item.id == 'cosmos:advanced_wafer') {{materials[1] += item.amount}};
		if (item.id == 'cosmos:tin_ingot') {{materials[2] += item.amount}};
		if (item.id == 'minecraft:iron_ingot') {{materials[3] += item.amount}};
	})
	results[1] = materials[0] >= 16 ? 't' : 'f'
	results[3] = materials[1] >= 1 ? 't' : 'f'
	results[5] = materials[2] >= 32 ? 't' : 'f'
	results[7] = materials[3] >= 24 ? 't' : 'f'
	return results.join('')
}
function angle_to_vector(angle, distance, center) {
	angle = (Math.PI / 180) * angle; // to randian
	return {
		x: Math.round(distance * Math.cos(angle)) + center.x,
		y: Math.round(distance * Math.sin(angle)/2) + center.y,
	}
}

const solar_system = {
	Sol: {tier: 100, x: 200, y: 101},
	Mercury: {tier: 4, distance: (129.2 - 101.5) * 2, turn: 88, init_angle: 250},
	Venus: {tier: 3, distance: (140.5 - 101.5) * 2, turn: 225, init_angle: 178},
	Overworld: {tier: 1, distance: (150.3 - 101.5) * 2, turn: 360, init_angle: 100},
	Mars: {tier: 2, x:246, distance: (160.2 - 101.5) * 2, turn: 687, init_angle: 0},
	Asteroids: {tier: 3, distance: (166.5 - 101.5) * 2},
	Jupiter: {tier: 4, distance: (172.4 - 101.5) * 2, turn: 11.86 * 360, init_angle: 36},
	Saturn: {tier: 100, distance: (182.3 - 101.5) * 2, turn: 29.46 * 360, init_angle: 47},
	Uranus: {tier: 100, distance: (192.7 - 101.5) * 2, turn: 84.01 * 360, init_angle: 315},
	Neptune: {tier: 100, distance: (201.6 - 101.5) * 2, turn: 164.79 * 360, init_angle: 296},
}

const overworld_moon = {tier: 1, distance:155.5};
const overworld_station = {tier: 1, distance:94.9};

function zoom_at(player, focused, planet) {
	const station = player.getDynamicProperty("has_space_station");
	let form = new ActionFormData()
	.title("Celestial Panel " +`§${station ? 't' : 'f'}`+ planet)
	if (focused == planet) {
		form.body(
			`§${rocket_tier >= solar_system[planet].tier ? 't' : 'f'}`+
			`§${station ? 't' : 'f'}`+
			`Tier ${solar_system[planet].tier < 6 ? '' + solar_system[focused]?.tier : '?' }`+
			`${planet}`
		)
	} else if (focused == 'Moon') {
		form.body(
			`§${rocket_tier >= overworld_moon.tier ? 't' : 'f'}`+
			`§${station ? 'f' : 't'}`+
			`Tier ${overworld_moon.tier < 6 ? '' + overworld_moon.tier : '?' }`+
			`Moon`
		)
	}
	form.button(
		`§${rocket_tier >= solar_system[planet].tier ? 't' : 'f'}`+
		`§${focused == planet ? 't' : 'f'}`+
		`${planet}`
	)
	let buttons = 0;
	if (planet == "Overworld") {
		buttons++;
		set_moon_location()
		form.button(
			`§${rocket_tier >= overworld_moon.tier ? 't' : 'f'}`+
			`§${focused == 'Moon' ? 't' : 'f'}`+
			`x${overworld_moon.x}`+
			`y${overworld_moon.y}`+
			`Moon`
		)
		if (player.getDynamicProperty('has_space_station')) {
			buttons++;
			set_station_location()
			form.button(
				`§${rocket_tier >= overworld_station.tier ? 't' : 'f'}`+
				`§${focused == 'Space_Station' ? 't' : 'f'}`+
				`x${overworld_station.x}`+
				`y${overworld_station.y}`+
				`Space Station`
			)
		}
	}
	form.button("LAUNCH")
	.button(read_inventory(player) + "CREATE")
	.show(player)
	.then((response) => {
		if (response.canceled) {
			select_solar_system(player, ''); return;
		}
		switch (response.selection) {
			case 0: zoom_at(player, planet, planet); return;
			case buttons + 1: launch(player, focused); return; 
			case buttons + 2: create_station(player, focused); return;
		}
		if (buttons >= 1 && response.selection == 1) {zoom_at(player, 'Moon', 'Overworld'); return}
		if (buttons == 2 && response.selection == 2) {view_stations(player, ''); return}
	})
}

function view_stations(player, focused) {
	set_moon_location()
	set_station_location()
	const stations = JSON.parse(world.getDynamicProperty("space_stations") ?? '[]')
	world.sendMessage(focused)
	let form = new ActionFormData()
	.title("Celestial Panel Space Station " + focused)
	.body(
		`§${rocket_tier >= overworld_station.tier ? 't' : 'f'}`+
		`§t`+
		`Tier ${'' + overworld_station.tier}`+
		`${stations.find(i => i.name == focused)?.owner}`
	)
	.button(`§t§f$Overworld`)
	.button(
		`§${rocket_tier >= overworld_moon.tier ? 't' : 'f'}`+
		`§f`+
		`x${overworld_moon.x}`+
		`y${overworld_moon.y}`+
		`Moon`
	)
	.button(
		`§${rocket_tier >= overworld_station.tier ? 't' : 'f'}`+
		`§t`+
		`x${overworld_station.x}`+
		`y${overworld_station.y}`+
		`Space Station`
	)
	.button("LAUNCH")
	.button("RENAME")
	for (let station of stations) {
		form.button(
			`§t§${focused == station.name ? 't' : 'f'}`+
			`space_station: ${station.name}`
		)
	}
	form.show(player)
	.then((response) => {
		if (response.canceled) {
			select_solar_system(player, ''); return;
		}
		switch (response.selection) {
			case 0: zoom_at(player, 'Overworld', 'Overworld', '§f§f§f§f'); return; 
			case 1: zoom_at(player, 'Moon', 'Overworld', '§f§f§f§f'); return; 
			case 2: view_stations(player, ''); return; 
			case 3: launch(player, focused); return; 
			case 4: rename(player, focused); return;
		}
		const station = stations[response.selection - 5].name;
		view_stations(player, station);
	})
}

function select_solar_system(player, focused) {
	set_planet_locations()
	const station = player.getDynamicProperty("has_space_station");
	let form = new ActionFormData()
	.title("Celestial Panel Solar System")
	if (focused != '') {
		form.body(
			`§${rocket_tier >= solar_system[focused].tier ? 't' : 'f'}`+
			`§${station ? 't' : 'f'}`+
			`Tier ${solar_system[focused].tier < 6 ? '' + solar_system[focused]?.tier : '?' }`+
			`${focused}`
		)
	}
	for (let planet of Object.keys(solar_system)) {
		form.button(
			`§${rocket_tier >= solar_system[planet].tier ? 't' : 'f'}`+
			`§${focused == planet ? 't' : 'f'}`+
			`x${solar_system[planet].x}`+
			`y${solar_system[planet].y}`+
			`${planet}`
		)
	}
	form.button("LAUNCH")
	.button(read_inventory(player) + "CREATE")
	.show(player)
	.then((response) => {
		if (response.canceled) {
			//select_solar_system(player, ''); return; //disabled for testing
			return;
		}
		switch (response.selection) {
			case 10: launch(player, focused); return;
			case 11: create_station(player, focused); return;
		}
		const planet = Object.keys(solar_system)[response.selection]
		if (planet == focused) {zoom_at(player, planet, planet)}
		else {select_solar_system(player, planet)}
	})
}

function launch(player, planet) {
	player.sendMessage(`Launch ${player.nameTag} to ${planet}`)
}

function rename(player, station) {
	player.sendMessage(`Rename ${station}`)
}

function create_station(player, planet) {
	player.setDynamicProperty("has_space_station", true)
	const stations = JSON.parse(world.getDynamicProperty("space_stations") ?? '[]')
	stations.push({name: `${player.nameTag}'s station`, owner: player.nameTag})
	world.setDynamicProperty("space_stations", JSON.stringify(stations))
	player.runCommand("clear @s cosmos:aluminum_ingot 0 16");
	player.runCommand("clear @s cosmos:advanced_wafer 0 1");
	player.runCommand("clear @s cosmos:tin_ingot 0 32");
	player.runCommand("clear @s iron_ingot 0 24");
	zoom_at(player, planet, planet)
}

world.afterEvents.itemUse.subscribe(({itemStack, source}) => {
	if ( (itemStack.typeId === "minecraft:compass") ) {
		set_asteroids_location()
		select_solar_system(source, '')
	}
})


// RENAME TOUCH
// world.afterEvents.playerInteractWithEntity.subscribe(({target}) => {
// 	target.nameTag = 'name'
// })