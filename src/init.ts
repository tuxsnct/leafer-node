import { existsSync, mkdir, writeFileSync } from 'fs'
import { Client } from 'discord.js'

const init = (client: Client) => {
  process.on('exit', () => {})
  process.on('SIGINT', () => {
    process.exit(0)
  })
  if (!existsSync('./tmp')) {
    mkdir('./tmp', err => {
      if (err) {
        throw err
      }
    })
  }
  if (!existsSync('./tmp/leafer.json')) {
    writeFileSync('./tmp/leafer.json', '{}')
  }

  client.on('ready', () => {
    console.log(`Leafer is running now.`)
  })
}

export default init
