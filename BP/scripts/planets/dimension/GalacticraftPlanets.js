import { Player, Entity, world, ScreenDisplay, system } from "@minecraft/server";
import { Gravity } from "./gravity.js"
export { Planet };

const the_end = world.getDimension('the_end');


let ALL_PLANETS = {}
/**
 * Class representing a generic Planet
 */
class Planet {
    /**
     * Creates an instance of a Planet
     * @param {Object} options - Options for the planet
     * @param {string} options.type - ID of the planet
     * @param {Object} options.range - Range of the planet
     * @param {Number} options.gravity - Gravity of the planet
     */
    constructor({ type, range, gravity }) {
        this.#type = type;
        this.#range = range;
        this.#center = {
            x: (this.range.start.x + this.range.end.x) / 2,
            z: (this.range.start.z + this.range.end.z) / 2
        };
        this.#gravity = gravity;
        this.#eventsHandler = new PlanetEvents(this);
    }

    #range
    #type
    #center
    #gravity
    #eventsHandler

    /**
     * Gets the type of the planet
     * @returns {String} The ID of the planet
     */
    get type() {
        return this.#type + '';
    }

    /**
     * Gets the range of the planet
     * @returns {Object} The range of the planet with start and end coordinates
     */
    get range() {
        return {
            start: { x: this.#range.start.x, z: this.#range.start.z },
            end: { x: this.#range.end.x, z: this.#range.end.z }
        };
    }

    /**
     * Gets the center coordinates of the planet
     * @returns {Vector3} The center coordinates of the planet
     */
    get center() {
        return {
            x: this.#center.x,
            z: this.#center.z
        };
    }

    /**
     * Gets the gravity of the planet
     * @returns {Number} The gravity of the planet
     */
    get gravity() {
        return this.#gravity + 0;
    }

    /**
    * Gets the event handler for this planet
    * @returns {PlanetEvents} Event Handler
    */
    get events() {
        return this.#eventsHandler
    }

    /**
     * Checks whether a given location is on the planet
     * @param {Vector3} location - Location to check
     * @returns {Boolean} Whether or not the location is on the planet
     */
    isOnPlanet(location) {
        return (
            this.range.start.x <= location.x && location.x <= this.range.end.x &&
            this.range.start.z <= location.z && location.z <= this.range.end.z
        );
    }

    /**
     * Gets all entities in the End that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions - Query to use for search
     * @returns {Entity[]} All entities matching the query
     */
    getEntities(entityQueryOptions) {
        return the_end.getEntities(entityQueryOptions).filter(entity => 
            this.isOnPlanet(entity.location)
        );
    }

    /**
     * Gets all players on the planet that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions - Query to use for search
     * @returns {Player[]} All players matching the query
     */
    getPlayers(entityQueryOptions) {
        return the_end.getPlayers(entityQueryOptions).filter(entity => 
            this.isOnPlanet(entity.location)
        );
    }

    /**
     * Offsets the given location relative to the planet's center
     * @param {Vector3} location - The location to offset
     * @returns {Vector3} The offset location relative to the planet's center
     */
    offset(location) {
        return {
            x: location.x - this.center.x,
            y: location.y, 
            z: location.z - this.center.z
        };
    }

    /**
     * Registers a new planet with the given ID and options
     * @param {string} id - The ID of the planet to register
     * @param {Object} options - Options for the planet
     * @throws {Error} Throws an error if a planet with the same ID is already registered
     */
    static register(id, options) {
        if (Planet.get(id) !== undefined) throw new Error('Planet with id "' + id + '" is already registered');
        options = {
            range: options.range || { start: { x: -1, z: -1 }, end: { x: 1, z: 1 } },
            gravity: options.gravity || 9.8
        };
        ALL_PLANETS[id] = new Planet({ type: id, range: options.range, gravity: options.gravity });
        return Planet.get(id)
    }

    /**
     * Retrieves a registered planet by its ID
     * @param {string} id - The ID of the planet to retrieve
     * @returns {Planet|undefined} The planet if found, otherwise undefined
     */
    static get(id) {
        return ALL_PLANETS[id];
    }

    /**
     * Retrieves all registered planets
     * @returns {Planet[]} An array of all registered planets
     */
    static getAll() {
        return Object.keys(ALL_PLANETS).map(id => this.get(id));
    }
}

class PlanetEvents {
    constructor(planet) {
        this.#planet = planet
        let data = {
            players: {}
        }
        system.runInterval(() => {
            let events = this.getAllEvents()
            let planetPlayers = this.planet.getPlayers()

            if (planetPlayers.length != Object.keys(data.players).length) {
                let newPlayers = planetPlayers.filter(player => data.players[player.id] == undefined)
                let leavePlayers = Object.keys(data.players).filter(id => !planetPlayers.some(player => player.id == id)).map(id => world.getEntity(id)).filter(player => player.isValid())
                
                for (let i = 0; i < leavePlayers.length; i++) {
                    let player = leavePlayers[i]
                    delete data.players[player.id]
                    system.runTimeout(() => {
                        for (let event of events) {
                            if (event.type == 'onLeave' && player.isValid()) {
                                event.callback(event, player)
                            }
                        }
                    }, i+1)
                }

                system.runTimeout(() => {
                    for (let i = 0; i < newPlayers.length; i++) {
                        let player = newPlayers[i]
                        data.players[player.id] = player
                        system.runTimeout(() => {
                            for (let event of events) {
                                if (event.type == 'onJoin' && player.isValid()) {
                                    event.callback(event, player)
                                }
                            }
                        }, i+1)
                    }
                }, leavePlayers.length + 1)
            }
        }, 20)
        this.#events = {}
    }
    #planet
    #events

    /**
     * returns the planet to which the event handler is bound
     * @returns {Planet}
    */
    get planet() {
        return this.#planet
    }

    /**
     * 
     * @param {String} id unique ID for the event
     * @param {String} type event type, for example `onJoin`
     * @param {Function} callback callback function
     * @throws {Error} Returns an error if an event with the same ID already exists
     * @returns {PlanetEvent} registered event
     */
    addEvent(id, type, callback) {
        if (this.#events[id] != undefined) throw new Error('event with ID ' + id + ' has already been registered');
        this.#events[id] = new PlanetEvent(id, type, callback, this)
        return this.#events[id]
    }

    /**
     * Deletes this event
     * @param {String} eventId
     */
    removeEvent(eventId) {
        delete this.#events[eventId]
    }

    /**
     * @param {String} id 
     * @returns {PlanetEvent|undefined}
     */
    getEvent(id) {
        return this.#events[id]
    }

    /**
     * @returns {PlanetEvent[]}
     */
    getAllEvents() {
        return Object.keys(this.#events).map(id => this.getEvent(id))
    }


    /**
     * registers an event that is triggered when a player arrives on the planet
     * @param {String} id id of the event
     * @param {Function} callback function that accepts PlanetEvent and Player
     * @returns {PlanetEvent}
     */
    onJoin(id, callback) {
        return this.addEvent(id, 'onJoin', callback)
    }

    /**
     * registers an event that is triggered when a player leaves the planet
     * @param {String} id id of the event
     * @param {Function} callback function that accepts PlanetEvent and Player
     * @returns {PlanetEvent}
     */
    onLeave(id, callback) {
        return this.addEvent(id, 'onLeave', callback)
    }
}

class PlanetEvent {
    constructor(id, type, callback, handler) {
        this.#id = id
        this.#type = type
        this.#callback = callback
        this.#handler = handler
    }
    #id
    #type
    #callback
    #handler

    // properties of this event

    /**
     * @returns {Function}
     */
    get callback() {
        return this.#callback
    }

    /**
     * @returns {String}
     */
    get type() {
        return this.#type + ''
    }

    /**
     * @returns {String}
     */
    get id() {
        return this.#id + ''
    }

    /**
     * @returns {PlanetEvents}
     */
    get handler() {
        return this.#handler
    }

    /**
     * deletes this event
     */
    remove() {
        this.handler.removeEvent(this.id)
    }
}

// Coordinate display

// Returns the coordinates that should be displayed on the screen
function planet_coords(entity) {
  if (entity.dimension.id != 'minecraft:the_end') return entity.location;
  let planet = Planet.getAll().find(pl => pl.isOnPlanet(entity.location))
  return planet?.offset(entity.location) || entity.location
}

world.afterEvents.gameRuleChange.subscribe(({rule, value}) => {
    if (rule == "showCoordinates" && value == false)
        world.getAllPlayers().forEach(player =>
            player.onScreenDisplay.setActionBar(`§.`)
        )
    }
)

system.runInterval(() => {
    if (!world.gameRules.showCoordinates) return
    world.getAllPlayers().forEach(player => {
        let {x, y, z} = planet_coords(player)
        x = Math.floor(x)
        y = Math.floor(y)
        z = Math.floor(z)
        player.onScreenDisplay.setActionBar(`Position: ${x}, ${y}, ${z}`)
    })
})

// Adding Gravity
system.runTimeout(() => {
    for (let planet of Planet.getAll()) {
        planet.events.onJoin('addGravity', ((event, player) => {
            new Gravity(player).setTemp(planet.gravity)
        }))

        planet.events.onLeave('removeGravity', ((event, player) => {
            new Gravity(player).setTemp(9.8)
        }))
    }
})