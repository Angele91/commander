/* eslint-disable no-await-in-loop */
import {Args, Command, ux} from '@oclif/core'
import {existsSync} from 'node:fs'
import {isEmpty} from 'lodash'
import {executeCommands, getBaseDir, getCommand, getCommands, handleMissingDependencies} from '../helper'
import {prompt} from 'inquirer'

export default class Execute extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {}

  static args = {
    file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Execute)

    const commanderDir = getBaseDir()

    if (!existsSync(commanderDir)) {
      console.log('No commands found')
      return
    }

    ux.action.start('Checking commands')
    let choice = args.file
    ux.action.stop()

    if (!choice || isEmpty(choice) || !getCommand(choice!)) {
      if (choice && !getCommand(choice)) {
        this.log('That command does not exist')
      }

      const commands = getCommands()

      while (!choice) {
        choice = await prompt([{
          type: 'list',
          name: 'command',
          message: 'Which command do you want to execute?',
          choices: commands.map(cmd => cmd.name),
        }]).then(answer => answer.command)
      }
    }

    const command = getCommand(choice)
    const executedCommands: string[] = []

    let remainingCommands = [...command!.commands ?? []]

    while (remainingCommands.length > 0) {
      const executed = await executeCommands(remainingCommands, executedCommands)
      if (!executed) {
        handleMissingDependencies(remainingCommands, executedCommands, this)
      }

      remainingCommands = remainingCommands.filter(
        cmd => !executedCommands.includes(cmd.name),
      )

      this.debug('Remaining commands', remainingCommands.join(', '))
      remainingCommands = remainingCommands.filter(cmd => !executedCommands.includes(cmd.name))
    }
  }
}

