import {Args, Command, ux} from '@oclif/core'
import {getBaseDir, getCommand} from '../helper'
import {rmSync} from 'node:fs'
import path = require('path')

export default class Remove extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {}

  static args = {
    name: Args.string({description: 'name of the command'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Remove)

    const {name} = args

    if (!name) {
      this.error('You must specify a command name')
      return
    }

    this.log(`Removing ${name}`)

    const command = getCommand(name)

    if (!command) {
      this.error('That command does not exist')
      return
    }

    ux.action.start('Removing command')

    rmSync(path.join(getBaseDir(), name), {recursive: true, force: true})

    ux.action.stop()

    this.log('Command removed')
  }
}
