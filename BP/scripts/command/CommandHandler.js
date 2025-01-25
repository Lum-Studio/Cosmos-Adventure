import { system } from "@minecraft/server";
import { BlockTypes, ItemTypes, Player, world } from "@minecraft/server";
const PREFIX = '!';
export class CommandArg {
    constructor({ name, type, required, values, min, max, self, relative, float, minLength, maxLength, matches, subArgs }) {
        this.name = name;
        this.type = type;
        this.required = required;
        this.values = values;
        this.min = min;
        this.max = max;
        this.self = self;
        this.relative = relative;
        this.subArgs = subArgs;
        this.float = float;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.matches = matches;
    }
    /**
     * Crates a literal argument type
     * @param name The name of the argument
     * @param required
     * @param values
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getString(argName)``` to get this argument
     */
    static literal(name, required, values, subArgs) {
        return new CommandArg({
            name,
            type: 'literal',
            required,
            values,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Crates a string argument type
     * @param name The name of the argument
     * @param required
     * @param minLength The minimum length required for the string
     * @param maxLength The maximum length required for the string
     * @param matches The regular expression this string must match
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getString(argName)``` to get this argument
     */
    static string(name, required, minLength, maxLength, matches, subArgs) {
        return new CommandArg({
            name,
            type: 'string',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength,
            maxLength,
            matches,
            subArgs
        });
    }
    /**
     * Crates a number argument type
     * @param name The name of the argument
     * @param required
     * @param min Minimum numeric value for this argument
     * @param max Maximum numeric value for this argument
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getInteger(argName)``` or ```interaction.getFloat(argName)``` to get this argument
     */
    static number(name, required, min, max, float, subArgs) {
        return new CommandArg({
            name,
            type: 'number',
            required,
            values: undefined,
            min,
            max,
            self: undefined,
            relative: undefined,
            float,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Crates a boolean argument type
     * @param name The name of the argument
     * @param required
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getBoolean(argName)``` to get this argument
     */
    static boolean(name, required, subArgs) {
        return new CommandArg({
            name,
            type: 'boolean',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Crates a player argument type
     * @param name The name of the argument
     * @param required
     * @param self If set to true you can target yourself with this argument
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getPlayer(argName)``` to get this argument
     */
    static player(name, required, self, subArgs) {
        return new CommandArg({
            name,
            type: 'player',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Creates a time argument type
     * @param name The name of the argument
     * @param required
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getTime(argName)``` to get this argument
     */
    static time(name, required, subArgs) {
        return new CommandArg({
            name,
            type: 'time',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Creates a position argument type
     * @param name The name of the argument
     * @param required
     * @param relative If set to true you can use relative values for this argument
     * @param subArgs
     * @returns
     * @remarks This method will retrun three arguments in the format argNameX, argNameY, argNameZ
     * @remarks Remember to use the spread operator when using this function because it returns an array of arguments.
     * @remarks To get this argument as Vector3 you must use ```interaction.getPosition(argName)```
     */
    static position(name, required, relative = true, subArgs) {
        return [
            new CommandArg({ name: `${name}X`, type: 'positionX', required, values: undefined, min: undefined, max: undefined, self: undefined, relative: relative, float: undefined, minLength: undefined, maxLength: undefined, matches: undefined, subArgs }),
            new CommandArg({ name: `${name}Y`, type: 'positionY', required, values: undefined, min: undefined, max: undefined, self: undefined, relative: relative, float: undefined, minLength: undefined, maxLength: undefined, matches: undefined, subArgs }),
            new CommandArg({ name: `${name}Z`, type: 'positionZ', required, values: undefined, min: undefined, max: undefined, self: undefined, relative: relative, float: undefined, minLength: undefined, maxLength: undefined, matches: undefined, subArgs })
        ];
    }
    /**
     * Creates an item argument type
     * @param name The name of the argument
     * @param required
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getItem(argName)``` to get this argument
     */
    static item(name, required, subArgs) {
        return new CommandArg({
            name,
            type: 'item',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
    /**
     * Creates a block argument type
     * @param name The name of the argument
     * @param required
     * @param subArgs
     * @returns
     * @remarks Use ```interaction.getBlock(argName)``` to get this argument
     */
    static block(name, required, subArgs) {
        return new CommandArg({
            name,
            type: 'block',
            required,
            values: undefined,
            min: undefined,
            max: undefined,
            self: undefined,
            relative: undefined,
            float: undefined,
            minLength: undefined,
            maxLength: undefined,
            matches: undefined,
            subArgs
        });
    }
}
export class CommandInteraction {
    constructor(args, ctx) {
        this.args = {};
        this.args = args;
        this.ctx = ctx;
    }
    /**
     * Checks if the ctx used this argument
     * @param argName
     * @returns
     */
    hasArg(argName) {
        const value = this.args?.[argName];
        if (value)
            return true;
        return false;
    }
    /**
     * Gets a string type argument
     * @param argName
     * @returns
     */
    getString(argName) {
        const value = this.args[argName];
        if (typeof value === "string")
            return value;
        throw new Error(`Argument "${argName}" is not of type string.`);
    }
    /**
     * Gets an integer type argument
     * @param argName
     * @returns
     */
    getInteger(argName) {
        const value = this.args[argName];
        if (typeof value !== "number")
            throw new Error(`Argument "${argName}" is not of type number.`);
        if (!Number.isInteger(value))
            throw new Error(`Argument "${argName}" is not an integer.`);
        return value;
    }
    /**
     * Gets a float type argument
     * @param argName
     * @returns
     */
    getFloat(argName) {
        const value = this.args[argName];
        if (typeof value !== "number")
            throw new Error(`Argument "${argName}" is not of type number.`);
        if (Number.isInteger(value))
            throw new Error(`Argument "${argName}" is not a float.`);
        return value;
    }
    /**
     * Gets a boolean type argument
     * @param argName
     * @returns
     */
    getBoolean(argName) {
        const value = this.args[argName];
        if (typeof value === "boolean")
            return value;
        throw new Error(`Argument "${argName}" is not of type boolean.`);
    }
    /**
     * Gets a player type argument
     * @param argName
     * @returns
     */
    getPlayer(argName) {
        const value = this.args[argName];
        if (value instanceof Player)
            return value;
        throw new Error(`Argument "${argName}" is not of type player.`);
    }
    /**
     * Gets a time type argument
     * @param argName
     * @returns
     */
    getTime(argName) {
        const value = this.args[argName];
        if (!value?.match(timeRegex)?.length)
            throw new Error(`Argument "${argName}" is not of type time.`);
        return MS(value);
    }
    /**
     * Gets a position type argument
     * @param argName
     * @returns
     */
    getPosition(argName) {
        const args = Object.entries(this.args).filter(arg => arg[0].startsWith(argName));
        const vector = {
            x: args.find(arg => arg[0] === `${argName}X`)?.[1],
            y: args.find(arg => arg[0] === `${argName}Y`)?.[1],
            z: args.find(arg => arg[0] === `${argName}Z`)?.[1]
        };
        if (!vector?.x || !vector?.y || !vector?.z || isNaN(vector.x) || isNaN(vector.y) || isNaN(vector.z))
            throw new Error(`Argument "${argName}" is not of type position.`);
        return vector;
    }
    /**
     * Gets a raw argument
     * @param argName
     * @returns
     */
    getRawArg(argName) {
        const value = this.args[argName];
        return value;
    }
    /**
     * Gets a item type argument
     * @param argName
     * @returns
     */
    getItem(argName) {
        const value = this.args[argName];
        if (!ItemTypes.get(value))
            throw new Error(`Argument ${argName} is not of type item.`);
        return value;
    }
    /**
     * Gets a block argument type
     * @param argName
     * @returns
     */
    getBlock(argName) {
        const value = this.args[argName];
        if (!BlockTypes.get(value))
            throw new Error(`Argument ${argName} is not of type block.`);
        return value;
    }
}
export class CommandHandler {
    constructor() {
        this.commands = new Map();
    }
    /**
     * Registers a command in the server
     * @param command
     */
    registerCommand(command) {
        if (this.commands.has(command.name)) {
            throw new Error(`Command "${command.name}" is already registered.`);
        }
        this.commands.set(command.name, command);
    }
    /**
     * Gets a command instance
     * @param command
     * @returns
     */
    get(command) {
        return this.commands.get(command) || undefined;
    }
    /**
     * Gets all commands registered
     * @returns
     */
    all() {
        return this.commands.values();
    }
    /**
     * Executes a command line
     * @param commandLine
     * @param sender
     */
    executeCommand(commandLine, sender) {
        try {
            const { name, rawArgs: rawArguments } = parseCommandLine(commandLine);
            let command = this.commands.get(name);
            const commands = [...this.all()];
            if (!command)
                command = commands.find(command => command?.aliases?.length && command.aliases.includes(name));
            if (!command) {
                throw new Error(`Unknown command: ${name}. Please check that the command exists and that you have permission to use it.`);
            }
            const parsedArgs = {};
            function parseArgs(args, rawArgs, handler) {
                args?.forEach((arg, index) => {
                    const rawArg = rawArgs[index];
                    if (arg.required && rawArg === undefined) {
                        throw new Error(`Missing required argument: ${arg.name}`);
                    }
                    if (rawArg !== undefined) {
                        parsedArgs[arg.name] = handler.parseArg(rawArg, arg, sender);
                    }
                    if (arg?.subArgs) {
                        const subArgs = arg.subArgs;
                        parseArgs(subArgs[rawArg], rawArgs.slice(index + 1), handler);
                    }
                });
            }
            parseArgs(command.args, rawArguments, this);
            console.warn(JSON.stringify(parsedArgs, undefined, 2));
            const interaction = new CommandInteraction(parsedArgs, sender);
            if (sender && command?.requires && !command.requires(sender))
                throw new Error(`Unknown command: ${command.name}. Please check that the command exists and that you have permission to use it.`);
            command.execute(interaction);
        }
        catch (e) {
            sender.sendMessage(`§c${e}`);
            sender.playSound('block.false_permissions');
        }
    }
    /**
     * Parses a raw argument
     * @param value
     * @param arg
     * @param ctx
     * @returns
     */
    parseArg(value, arg, ctx) {
        const { type } = arg;
        switch (type) {
            case "string":
                if (arg?.minLength && value?.length < arg.minLength)
                    throw new Error(`Argument ${arg.name} requires a minimum length of ${arg.minLength}`);
                if (arg?.maxLength && value?.length > arg.maxLength)
                    throw new Error(`Argument ${arg.name} requires a maximum length of ${arg.maxLength}`);
                if (arg?.matches && !arg.matches?.expression.test(value))
                    throw new Error(arg?.matches?.message);
                return value;
            case "number":
                const num = Number(value);
                if (isNaN(num))
                    throw new Error(`Argument ${arg.name} must be a number`);
                if (arg?.min !== undefined && arg?.min !== null && num < arg.min)
                    throw new Error(`Argument ${arg.name} requires a number greather than or equal to ${arg.min}`);
                if (arg?.max !== undefined && arg?.max !== null && num > arg.max)
                    throw new Error(`Argument ${arg.name} requires a number less than or equal to ${arg.max}`);
                if (!arg?.float && !Number.isInteger(num))
                    throw new Error(`Argument ${arg.name} requires an integer number`);
                return num;
            case "boolean":
                if (value !== "true" && value !== "false") {
                    throw new Error(`Argument ${arg.name} must be a boolean`);
                }
                return value === "true";
            case "player":
                if (value === '@s' || value === '@p')
                    value = ctx.name;
                if (value === '@r') {
                    let players = world.getAllPlayers();
                    const randomPlayer = players[Math.floor(Math.random() * players.length)];
                    value = randomPlayer.name;
                }
                if (value.startsWith('@'))
                    value = value.replace('@', '').trim();
                if (value === ctx.name && !arg?.self)
                    throw Error(`Argument ${arg.name} requires a player that is not yourself`);
                const player = this.findPlayerByName(value);
                if (!player)
                    throw Error(`Argument of type player must be an online player`);
                return player;
            case 'literal':
                if (!arg?.values?.includes(value)) {
                    throw new Error(`Literal ${arg.name} must be: ${arg?.values?.join(' | ')}`);
                }
                return value;
            case 'time':
                if (!value?.match(timeRegex)?.length)
                    throw new Error(`Argument ${arg.name} must be of type time`);
                return value;
            case 'positionX': {
                if (value.includes('~') && !arg?.relative)
                    throw new Error(`Argument ${arg.name} cannot be a relative location`);
                let absoluteValue = 0;
                if (value.includes('~')) {
                    if (value === '~') {
                        absoluteValue = ctx.location.x;
                    }
                    else {
                        const relative = value.slice(1);
                        if (relative === '') {
                            absoluteValue = ctx.location.x;
                        }
                        else if (!isNaN(Number(relative))) {
                            absoluteValue = ctx.location.x + Number(relative);
                        }
                        else {
                            throw new Error(`Argument ${arg.name} must be a valid relative position`);
                        }
                    }
                }
                else if (!isNaN(Number(value))) {
                    absoluteValue = Number(value);
                }
                else {
                    throw new Error(`Argument ${arg.name} must be of type position`);
                }
                return absoluteValue;
            }
            case 'positionY': {
                if (value.includes('~') && !arg?.relative)
                    throw new Error(`Argument ${arg.name} cannot be a relative location`);
                let absoluteValue = 0;
                if (value.includes('~')) {
                    if (value === '~') {
                        absoluteValue = ctx.location.y;
                    }
                    else {
                        const relative = value.slice(1);
                        if (relative === '') {
                            absoluteValue = ctx.location.y;
                        }
                        else if (!isNaN(Number(relative))) {
                            absoluteValue = ctx.location.y + Number(relative);
                        }
                        else {
                            throw new Error(`Argument ${arg.name} must be a valid relative position`);
                        }
                    }
                }
                else if (!isNaN(Number(value))) {
                    absoluteValue = Number(value);
                }
                else {
                    throw new Error(`Argument ${arg.name} must be of type position`);
                }
                return absoluteValue;
            }
            case 'positionZ': {
                if (value.includes('~') && !arg?.relative)
                    throw new Error(`Argument ${arg.name} cannot be a relative location`);
                let absoluteValue = 0;
                if (value.includes('~')) {
                    if (value === '~') {
                        absoluteValue = ctx.location.z;
                    }
                    else {
                        const relative = value.slice(1);
                        if (relative === '') {
                            absoluteValue = ctx.location.z;
                        }
                        else if (!isNaN(Number(relative))) {
                            absoluteValue = ctx.location.z + Number(relative);
                        }
                        else {
                            throw new Error(`Argument ${arg.name} must be a valid relative position`);
                        }
                    }
                }
                else if (!isNaN(Number(value))) {
                    absoluteValue = Number(value);
                }
                else {
                    throw new Error(`Argument ${arg.name} must be of type position`);
                }
                return absoluteValue;
            }
            case 'item':
                const itemType = ItemTypes.get(value);
                if (!itemType)
                    throw new Error(`Argument ${arg.name} must be of type item`);
                return itemType.id;
            case 'block':
                const blockType = BlockTypes.get(value);
                if (!blockType)
                    throw new Error(`Argument ${arg.name} must be of type block`);
                return blockType.id;
            default:
                throw new Error(`Unsupported argument type: ${type}`);
        }
    }
    /**
     * /Finds a player by it's name
     * @param name
     * @returns
     */
    findPlayerByName(name) {
        return world.getPlayers().find((p) => p.name === name) || undefined;
    }
}
const handler = new CommandHandler();
export default handler;
/**
 * Parses a command line to get it's raw arguments
 * @param commandLine
 * @returns
 */
export function parseCommandLine(commandLine) {
    if (!commandLine || typeof commandLine !== "string") {
        throw new Error("commandLine must be a non-empty string.");
    }
    const regex = /"([^"]*)"|(\S+)/g;
    const matches = Array.from(commandLine.matchAll(regex));
    if (!matches.length) {
        throw new Error("No valid arguments found in command line.");
    }
    const args = matches.map(match => match[1] || match[2]);
    const [name, ...rawArgs] = args;
    if (!name) {
        throw new Error("Command name is missing or invalid.");
    }
    return { name, rawArgs };
}
world.beforeEvents.chatSend.subscribe(data => {
    const sender = data.sender;
    let message = data.message;
    if (!data.message.startsWith(PREFIX)) {
        return;
    }
    data.cancel = true;
    const commandLine = message.slice(PREFIX.length).trim();
    system.run(() => handler.executeCommand(commandLine, sender));
});
export const timeRegex = /-?\d*\.?\d+\s*?(years?|yrs?|weeks?|days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|milliseconds?|msecs?|ms|[smhdwy])/gi;
export function MS(value, { compactDuration, fullDuration, avoidDuration } = {}) {
    try {
        if (typeof value === 'string') {
            if (/^\d+$/.test(value))
                return Number(value);
            const durations = value.match(/-?\d*\.?\d+\s*?(years?|yrs?|weeks?|days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|milliseconds?|msecs?|ms|[smhdwy])/gi);
            return durations ? durations.reduce((a, b) => a + toMS(b), 0) : null;
        }
        if (typeof value === 'number')
            return toDuration(value, { compactDuration, fullDuration, avoidDuration });
        throw new Error('Value is not a string or a number');
    }
    catch (err) {
        const message = isError(err)
            ? `${err.message}. Value = ${JSON.stringify(value)}`
            : 'An unknown error has occured.';
        throw new Error(message);
    }
}
;
/**
 * Convert Durations to milliseconds
 */
const toMS = (value) => {
    const number = Number(value.replace(/[^-.0-9]+/g, ''));
    value = value.replace(/\s+/g, '');
    if (/\d+(?=y)/i.test(value))
        return number * 3.154e+10;
    if (/\d+(?=w)/i.test(value))
        return number * 6.048e+8;
    if (/\d+(?=d)/i.test(value))
        return number * 8.64e+7;
    if (/\d+(?=h)/i.test(value))
        return number * 3.6e+6;
    if (/\d+(?=m)/i.test(value))
        return number * 60000;
    if (/\d+(?=s)/i.test(value))
        return number * 1000;
    if (/\d+(?=ms|milliseconds?)/i.test(value))
        return number;
};
/**
 * Convert milliseconds to durations
 */
const toDuration = (value, { compactDuration, fullDuration, avoidDuration } = {}) => {
    const absMs = Math.abs(value);
    const duration = [
        { short: 'w', long: 'week', duration: Math.floor(absMs / 6.048e+8) },
        { short: 'd', long: 'day', duration: Math.floor(absMs / 8.64e+7) % 7 },
        { short: 'h', long: 'hour', duration: Math.floor(absMs / 3.6e+6) % 24 },
        { short: 'm', long: 'minute', duration: Math.floor(absMs / 60000) % 60 },
        { short: 's', long: 'second', duration: Math.floor(absMs / 1000) % 60 },
        { short: 'ms', long: 'millisecond', duration: absMs % 1000 }
    ];
    const mappedDuration = duration
        .filter(obj => obj.duration !== 0 && avoidDuration ? fullDuration && !avoidDuration.map(v => v.toLowerCase()).includes(obj.short) : obj.duration)
        .map(obj => `${Math.sign(value) === -1 ? '-' : ''}${compactDuration ? `${Math.floor(obj.duration)}${obj.short}` : `${Math.floor(obj.duration)} ${obj.long}${obj.duration === 1 ? '' : 's'}`}`);
    const result = fullDuration ? mappedDuration.join(compactDuration ? ' ' : ', ') : mappedDuration[0];
    return result || `${absMs}`;
};
/**
 * A type guard for errors.
 */
const isError = (error) => {
    return typeof error === 'object' && error !== null && 'message' in error;
};