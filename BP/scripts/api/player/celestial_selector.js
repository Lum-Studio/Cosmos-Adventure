import { ActionFormData} from "@minecraft/server-ui" ;
import { world, system } from "@minecraft/server" ;
import { moon_lander } from "./liftoff";

const overworld = world.getDimension('overworld');
const rocket_tier = 3;
const debug = true

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
	if (player.getGameMode() == "creative") return {aluminum: true, wafer: true, tin: true, iron: true}
	const materials = {aluminum: 0, wafer: 0, tin: 0, iron: 0}
	const inventory = player.getComponent("inventory").container
	for (let slot = 0; slot < inventory.size; slot++) {
		const item = inventory.getItem(slot)
		if (!item) continue
		else if (item.typeId == 'cosmos:aluminum_ingot') {materials.aluminum += item.amount}
		else if (item.typeId == 'cosmos:advanced_wafer') {{materials.wafer += item.amount}}
		else if (item.typeId == 'cosmos:tin_ingot') {{materials.tin += item.amount}}
		else if (item.typeId == 'minecraft:iron_ingot') {{materials.iron += item.amount}}
	}
	materials.aluminum = materials.aluminum >= 16
	materials.wafer = materials.wafer >= 1
	materials.tin = materials.tin >= 32
	materials.iron = materials.iron >= 24
	return materials
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



function select_solar_system(player, tier=1) {
	set_planet_locations()
	const space_stations = JSON.parse(world.getDynamicProperty("all_space_stations") ?? '{}')
	const has_station = player.nameTag in space_stations
	let form = new ActionFormData()
	.title("Celestial Panel Solar System")
	.body(`Tier ${tier} Station ${has_station || ('false ' + JSON.stringify(read_inventory(player)))}`)
	.button(`Launch to Venus`)
	.button(`Launch to Overworld`)
	.button(`Launch to Mars`)
	.button(`Launch to Asteroids`)
	.button(`Launch to Moon`)
	.button(`Create Space Station`)
	for (let player_name of Object.keys(space_stations)) {
		const name = space_stations[player_name].name
		form.button(`Launch to ${name}`)
		form.button(`Rename ${name}`)
	}
	form.show(player).then((response) => {
		const focused = undefined
		if (response.canceled) {
			if (!debug) select_solar_system(player); return
		}
		switch (response.selection) {
			case 0: if (tier >= 3) launch(player, "Venus"); return
			case 1: launch(player, "Overworld"); return
			case 2: if (tier >= 2) launch(player, "Mars"); return
			case 3: if (tier >= 3) launch(player, "Asteroids"); return
			case 4: launch(player, "Moon"); return
			case 5: if (!Object.values(read_inventory(player)).includes(false)) create_station(player); return
		}
		const station_index = response.selection - 6
		const station = Object.values(space_stations)[Math.floor(station_index / 2)]
		if (station_index % 2 == 0) launch_to_station(player, station)
		if (station_index % 2 == 1) rename_station(player, station)
	})
}

function launch(player, planet) {
	player.setDynamicProperty("in_celestial_selector")
	if(planet == 'Moon' && player.getComponent("minecraft:riding")){
		let rocket = player.getComponent("minecraft:riding").entityRidingOn;
		let fuel = rocket.getDynamicProperty("fuel_level");
		rocket.remove();
		let moon = world.getDimension("the_end");
		let dimension = player.dimension;
		let loc = {x: 75000 + (Math.random() * 20), y: 1000, z: 75000 + (Math.random() * 20)};
		player.setDynamicProperty('dimension', JSON.stringify([planet, fuel]))
		player.teleport(loc, {dimension: moon});
		if(dimension.id == "minecraft:the_end") moon_lander(player);
	}
	if (debug) player.sendMessage(`Launch ${player.nameTag} to ${planet}`)
}
function launch_to_station(player, station) {
	player.setDynamicProperty("in_celestial_selector")
	if (debug) player.sendMessage(`Launch ${player.nameTag} to ${station.name}`)
}

function rename_station(player, station) {
	if (debug) player.sendMessage(`Rename ${station.name}`)
}

function create_station(player) {
	if (debug) player.sendMessage(`Create Space Station`)
	const space_stations = JSON.parse(world.getDynamicProperty("all_space_stations") ?? '{}')
	space_stations[player.nameTag] = {name: `${player.nameTag}'s Space Station`}
	space_stations['Zahar'] = {name: `NSS`}
	world.setDynamicProperty("all_space_stations", JSON.stringify(space_stations))
	// const stations = JSON.parse(world.getDynamicProperty("space_stations") ?? '[]')
	// stations.push({name: `${player.nameTag}'s station`, owner: player.nameTag})
	// world.setDynamicProperty("space_stations", JSON.stringify(stations))
	// player.runCommand("clear @s cosmos:aluminum_ingot 0 16");
	// player.runCommand("clear @s cosmos:advanced_wafer 0 1");
	// player.runCommand("clear @s cosmos:tin_ingot 0 32");
	// player.runCommand("clear @s iron_ingot 0 24");
	// zoom_at(player, planet, planet)
}

export function start_celestial_selector(player) {
	player.setDynamicProperty('in_celestial_selector', true)
	player.runCommand('hud @s hide all')
	const fade = system.runInterval(()=> {
		if (player.getDynamicProperty('in_celestial_selector')) {
			player.camera.fade({fadeTime: {fadeInTime: 0, fadeOutTime: 0.5, holdTime: 2}})
		} else {
			player.runCommand('hud @s reset')
			system.clearRun(fade)
		}
	}, 20)
	set_asteroids_location()
	select_solar_system(player)
}

world.afterEvents.itemUse.subscribe(({itemStack, source}) => {
	if (itemStack?.typeId != 'minecraft:compass') return
	select_solar_system(source, 3)
	//source.setDynamicProperty('in_celestial_selector')
})