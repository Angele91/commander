import {Args, Command} from '@oclif/core'
import {getCommands, updateCommand} from '../helper'
import {prompt} from 'inquirer'
import {isEmpty} from 'lodash'

export default class Update extends Command {
  static description = 'it updates a command'

  static examples = [
    '<%= config.bin %> <%= command.id %> [name]',
  ]

  static flags = {}

  static args = {
    name: Args.string({description: 'Command name'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Update)

    const {name: argName} = args
    let name = argName

    const commands = getCommands()

    if (!name || isEmpty(name)) {
      name = await prompt([{
        type: 'list',
        name: 'command',
        message: 'Which command do you want to update?',
        choices: commands.map(cmd => cmd.name),
      }]).then(answer => answer.command)
    }

    const command = commands.find(cmd => cmd.name === name)

    if (!command || !name) {
      this.log('That command does not exist')
      return
    }

    await updateCommand(command)
  }
}
