/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
import {Args, Command, ux} from '@oclif/core'
import {writeFileSync, existsSync, mkdirSync} from 'node:fs'
import {isEmpty} from 'lodash'
import {CommandStep} from '../types/command-step'
import {createStep, getBaseDir} from '../helper'
import path = require('node:path')
import {prompt} from 'inquirer'

export default class Create extends Command {
  static description = 'it creates a new command'

  static examples = [
    '<%= config.bin %> <%= command.id %> [name]',
  ]

  static flags = {}

  static args = {
    name: Args.string({description: 'Command name'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Create)

    let {name} = args

    if (!name || isEmpty(name)) {
      name = await prompt([{
        type: 'input',
        name: 'name',
        message: 'Write the command name',
      }]).then(answer => answer.name)
    }

    const commanderDir = getBaseDir()

    if (!existsSync(commanderDir)) {
      this.log('Creating .commander folder')
      mkdirSync(commanderDir)
    }

    if (!name) return

    const commandPath = path.join(commanderDir, name)
    const command = {
      name,
      steps: [] as CommandStep[],
    }

    while (true) {
      const step = await createStep(undefined, command.steps)

      command.steps.push(step)

      const addAnotherCommand = await prompt([{
        type: 'confirm',
        name: 'addAnotherCommand',
        message: 'Do you want to add another step?',
        default: false,
      }]).then(answer => answer.addAnotherCommand)

      if (!addAnotherCommand) {
        break
      }
    }

    ux.action.start('Writing command file')

    writeFileSync(commandPath, JSON.stringify(command, null, 2))

    ux.action.stop()

    this.log('Command created successfully')
    this.log(commandPath)
  }
}
