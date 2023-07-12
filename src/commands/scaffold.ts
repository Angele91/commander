/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
import {Args, Command, ux} from '@oclif/core'
import {writeFileSync, existsSync, mkdirSync} from 'node:fs'
import {isEmpty} from 'lodash'
import {CommandType} from '../types/command-type'
import {findPath, getBaseDir} from '../helper'
import path = require('node:path')
import {prompt} from 'inquirer'

export default class Scaffold extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %> [name]',
  ]

  static flags = {}

  static args = {
    name: Args.string({description: 'Command name'}),
  }

  public async run(): Promise<void> {
    let currentPath = process.cwd()
    const {args} = await this.parse(Scaffold)

    let {name} = args

    if (!name || isEmpty(name)) {
      name = await prompt([{
        type: 'input',
        name: 'name',
        message: 'Write the command ID',
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
      commands: [] as CommandType[],
    }

    while (true) {
      const commandName = await prompt([{
        type: 'input',
        name: 'name',
        message: 'Write the command to execute',
      }]).then(answer => answer.name)
      let dependencies: string[] = []

      if (command.commands.length > 0) {
        dependencies = await prompt([{
          type: 'checkbox',
          name: 'dependencies',
          message: `[${commandName}] Select the commands that should be executed before this one`,
          choices: command.commands.map(cmd => cmd.name),
        }]).then(answer => answer.dependencies)
      }

      const concurrence = await prompt([{
        type: 'confirm',
        name: 'concurrence',
        message: `[${commandName}] Should this command be executed concurrently?`,
        default: false,
      }]).then(answer => answer.concurrence)

      const executeInCurrentPath = await prompt([{
        type: 'confirm',
        name: 'executeInCurrentPath',
        message: `[${commandName}] Should this command be executed in the current path?`,
        default: false,
      }]).then(answer => answer.executeInCurrentPath)

      if (!executeInCurrentPath) {
        currentPath = await findPath()
      }

      // Check if the directory has a .git directory
      const hasGitDirectory = existsSync(path.join(currentPath, '.git'))
      let checkOutBranch = false

      if (hasGitDirectory) {
        checkOutBranch = await prompt([{
          type: 'confirm',
          name: 'checkOutBranch',
          message: `[${commandName}] Should this command check out a branch?`,
          default: false,
        }]).then(answer => answer.checkOutBranch)
      }

      // Check if the directory has a package.json file
      const hasPackageJson = existsSync(path.join(currentPath, 'package.json'))
      let runNpmInstall = false

      if (hasPackageJson) {
        runNpmInstall = await prompt([{
          type: 'confirm',
          name: 'runNpmInstall',
          message: `[${commandName}] Should this command run npm install?`,
          default: false,
        }]).then(answer => answer.runNpmInstall)
      }

      command.commands.push({
        name: commandName,
        dependencies,
        concurrence,
        path: currentPath,
        runNpmInstall,
        checkOutBranch,
      })

      const addAnotherCommand = await prompt([{
        type: 'confirm',
        name: 'addAnotherCommand',
        message: 'Do you want to add another command?',
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
