import {Command} from '@oclif/core'
import {getCommands, logCommands} from '../helper'

export default class List extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {}

  static args = {}

  public async run(): Promise<void> {
    const commands = getCommands()

    if (commands.length === 0) {
      this.log('No commands found')
      return
    }

    for (const command of commands) {
      this.log(command.name)
      logCommands(command.commands, this)
    }
  }
}
