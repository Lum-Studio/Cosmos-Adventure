
const fs = require('node:fs')

const strip_json = (file) => file.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)

const read_json = (path) => JSON.parse(strip_json(fs.readFileSync(path, {encoding: 'utf8'})))

const id_to_name = (id) => id.split(':')[1].replaceAll('_', ' ').replace(/\b\w/g, s => s.toUpperCase())

const get_folders = (path) => fs.readdirSync(path).filter(folder => fs.lstatSync(path + folder).isDirectory())

const make_comments = (json_text) => json_text
.split('\n').map(line => {
    const pad = line.split('"')[0]
    if (line.trim().startsWith(`"comment`)) line = pad + '//' + line.split(`": "`)[1].replace(`",`, '').replace(`"`, '')
    if (line.trim().startsWith(`"linebreak`)) line = ''
    return line
}).join('\n')

module.exports = {strip_json, read_json, id_to_name, get_folders, make_comments}