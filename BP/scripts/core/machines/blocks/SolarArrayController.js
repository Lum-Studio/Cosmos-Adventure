import { system, world } from "@minecraft/server";
import { load_dynamic_object, save_dynamic_object, compare_lists } from "../../../api/utils";
import { charge_battery } from "../../matter/electricity";

const data = {
	energy: { output: "back", capacity: 64000, maxPower: 1000 },
	items: {
		top_input: [0],
		side_input: [0],
	},
	onTick(entity, block) {
		const e = entity;
		let stopped = e.getDynamicProperty('stopped');
		if (stopped == undefined) stopped = true;
		const container = e.getComponent('minecraft:inventory').container;

		const variables = load_dynamic_object(e, "machine_data");
		let energy = variables.energy || 0;
		let power = variables.power || 0;
		let connected_panels = variables.connected_panels || 0;
		let environment = variables.environment || 0; // percentage
		let is_generating = variables.is_generating || 0;

		let first_values = [energy, power, connected_panels, environment, is_generating, stopped];

		if (!(system.currentTick % 20)) {
			let planet = e.getPlanet();
			let time = planet ? planet.getTimeOfDay() : world.getTimeOfDay();
			let daylight_length = planet ? planet.time.day : 12000;
			
			let is_day_time = (time <= daylight_length);

			if (!stopped && block != undefined) {
				// Count connected solar array modules
				connected_panels = 0;
				let { x, y, z } = block.location;
				
				let visited = new Set();
				let queue = [
					{x: x+1, y, z}, {x: x-1, y, z},
					{x, y, z: z+1}, {x, y, z: z-1}
				];
				
				while (queue.length > 0 && connected_panels < 1000) { // Safety limit 1000
					let curr = queue.shift();
					let key = `${curr.x},${curr.z}`;
					if (visited.has(key)) continue;
					visited.add(key);
					
					// Limit to 16 blocks radius
					if (Math.abs(curr.x - x) > 16 || Math.abs(curr.z - z) > 16) continue;
					
					try {
						let b = block.dimension.getBlock(curr);
						if (b && b.typeId === 'cosmos:solar_array_module') {
							// Simple sky check: check if the block directly above is air or transparent
							let above = block.dimension.getBlock({x: curr.x, y: curr.y + 1, z: curr.z});
							if (above && (above.isAir || above.isLiquid)) {
								connected_panels++;
							}
							
							queue.push({x: curr.x+1, y, z: curr.z});
							queue.push({x: curr.x-1, y, z: curr.z});
							queue.push({x: curr.x, y, z: curr.z+1});
							queue.push({x: curr.x, y, z: curr.z-1});
						}
					} catch(e) {
						// Catch loaded chunk boundaries
					}
				}
				
				environment = is_day_time ? 100 : 0;
				// Base generation formula from Galacticraft: solarStrength * 6.3F * solarBoost
				is_generating = Math.floor(connected_panels * 6.3 * (environment / 100));
			} else {
				is_generating = 0;
				environment = 0;
				connected_panels = 0;
			}
		}

		if (!stopped) {
			energy = Math.min(energy + is_generating, data.energy.capacity);
			energy = charge_battery(e, energy, 0); // Slot 0 is battery slot
		}
		
		power = Math.min(energy, data.energy.maxPower);
		save_dynamic_object(e, { energy, power, connected_panels, environment, is_generating }, "machine_data");

		// Update UI display if variables changed or battery item changed
		if (!compare_lists(first_values, [energy, power, connected_panels, environment, is_generating, stopped]) || !container.getItem(1)) {
			
			let status_info = stopped ? 'A 6Disabled' : (environment > 0 ? 'A 2Collecting Energy' : 'A 4Sun Is Not Visible');
			
			const generating_text = `Generating: ${is_generating} gJ/t`;
			const status_text = `Status: ${status_info}`;
			const environment_text = `Environment: ${environment}%%`;
			const connected_panels_text = `Connected Panels: ${connected_panels}`;

			// Add UI Display
			// These correspond to the dynamic strings in the UI Datagen / Controller UI
			container.add_ui_display(1, generating_text);
			container.add_ui_display(2, status_text);
			container.add_ui_display(3, environment_text);
			container.add_ui_display(4, connected_panels_text);
			
			// Button ID 0 is the Enable/Disable toggle button
			container.add_ui_button(0, stopped ? 'Enable' : 'Disable', entity, 'stopped', !stopped);
		}
	}
}; 

export default data;
