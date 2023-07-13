/* eslint-disable no-await-in-loop */
import {Args, Command, ux} from '@oclif/core'
import {existsSync} from 'node:fs'
import {isEmpty} from 'lodash'
import {executeSteps, getBaseDir, getCommand, getCommands, handleMissingDependencies} from '../helper'
import {prompt} from 'inquirer'

export default class Execute extends Command {
  static description = 'it executes a command'

  static examples = [
    '<%= config.bin %> <%= command.id %> [command]',
  ]

  static flags = {}

  static args = {
    command: Args.string({description: 'command to execute'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Execute)

    const commanderDir = getBaseDir()

    if (!existsSync(commanderDir)) {
      console.log('No commands found')
      return
    }

    ux.action.start('Checking commands')
    let choice = args.command
    ux.action.stop()

    if (!choice || isEmpty(choice) || !getCommand(choice!)) {
      if (choice && !getCommand(choice)) {
        this.log('That command does not exist')
      }

      const commands = getCommands()

      choice = await prompt([{
        type: 'list',
        name: 'command',
        message: 'Which command do you want to execute?',
        choices: commands.map(cmd => cmd.name),
      }]).then(answer => answer.command)
    }

    const command = getCommand(choice!)
    const executedSteps: string[] = []

    let remainingSteps = [...command!.steps ?? []]

    while (remainingSteps.length > 0) {
      const executed = await executeSteps(remainingSteps, executedSteps)
      if (!executed) {
        handleMissingDependencies(remainingSteps, executedSteps, this)
        continue
      }

      remainingSteps = remainingSteps.filter(
        cmd => !executedSteps.includes(cmd.name),
      )
    }
  }
}

