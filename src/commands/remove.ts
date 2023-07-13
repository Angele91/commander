import {Args, Command, ux} from '@oclif/core'
import {getBaseDir, getCommand, getCommands} from '../helper'
import {rmSync} from 'node:fs'
import {prompt} from 'inquirer'
import path = require('path')
import {isEmpty} from 'lodash'

export default class Remove extends Command {
  static description = 'it removes a command from the command list'

  static examples = [
    '<%= config.bin %> <%= command.id %> [command]',
  ]

  static flags = {}

  static args = {
    name: Args.string({description: 'name of the command'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Remove)

    let {name} = args

    const commands = getCommands()

    if (!name || isEmpty(name)) {
      this.log('You must specify a command name')
      name = await prompt([{
        type: 'list',
        name: 'name',
        message: 'Select a command to delete',
        choices: commands.map(cmd => cmd.name),
      }]).then(answer => answer.name)
    }

    this.log(`Removing ${name}`)

    const command = getCommand(name!)

    if (!command) {
      this.error('That command does not exist')
    }

    ux.action.start('Removing command')

    const dir = path.join(getBaseDir(), name!)
    rmSync(dir, {recursive: true, force: true})

    ux.action.stop()

    this.log('Command removed')
  }
}
