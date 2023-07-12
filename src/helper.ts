/* eslint-disable no-prototype-builtins */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable no-negated-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import {prompt} from 'inquirer'
import * as fs from 'node:fs'
import {join} from 'node:path'
import {CommandType} from './types/command-type'
import {execSync} from 'node:child_process'
import {Command} from '@oclif/core'
import {homedir} from 'node:os'
import path = require('node:path')
import {BASE_FOLDER_NAME} from './constants'
import {CommandContainerType} from './types/command-container-type'

/**
 * Finds and returns the path of a selected directory within the current directory and its subdirectories.
 *
 * @return {Promise<string>} The path of the selected directory.
 */
export async function findPath(): Promise<string> {
  const currentDirectory = homedir()
  let currentPath = currentDirectory

  while (true) {
    const files = fs.readdirSync(currentPath, {withFileTypes: true})
    const directories = files.filter(file => file.isDirectory()).map(directory => directory.name)

    const directory: string = await prompt([{
      type: 'list',
      name: 'directory',
      message: 'Select a directory',
      choices: ['..', '.', ...directories],
    }]).then(answer => answer.directory)

    currentPath = join(currentPath, directory)

    const stats = fs.statSync(currentPath)

    if (!stats.isDirectory()) {
      console.log('Selected path is not a directory')
      currentPath = currentDirectory
    } else {
      const continuePrompt = await prompt([{
        type: 'confirm',
        name: 'continue',
        message: 'Continue?',
      }]).then(answer => answer.continue)

      if (!continuePrompt) {
        break
      }
    }
  }

  return currentPath
}

/**
 * Executes a command and returns the result.
 *
 * @param {CommandType} command - The command to execute.
 * @param {string[]} executedCommands - The list of previously executed commands.
 * @return {void} - This function does not return any value.
 */
export async function executeCommand(
  command: CommandType,
  executedCommands: string[],
): Promise<void> {
  if (command.checkOutBranch) {
    const branchName = await prompt([{
      type: 'input',
      name: 'branchName',
      message: 'Write the branch name',
      default: 'main',
    }]).then(answer => answer.branchName)
    execSync('git fetch --all', {cwd: command.path, encoding: 'utf-8', stdio: 'inherit'})
    execSync('git pull', {cwd: command.path, encoding: 'utf-8', stdio: 'inherit'})
    execSync(`git checkout ${branchName}`, {cwd: command.path, encoding: 'utf-8', stdio: 'inherit'})
  }

  if (command.runNpmInstall) {
    try {
      // Run the command to check if yarn is installed
      execSync('yarn --version', {cwd: command.path})
      execSync('yarn install', {cwd: command.path, encoding: 'utf-8', stdio: 'inherit'})
    } catch {
      execSync('npm install', {cwd: command.path, encoding: 'utf-8', stdio: 'inherit'})
    }
  }

  execSync(command.name, {
    cwd: command.path,
    encoding: 'utf-8',
    stdio: 'inherit',
  })

  executedCommands.push(command.name)
}

/**
 * Executes a series of commands.
 *
 * @param {any[]} remainingCommands - The array of remaining commands to execute.
 * @param {string[]} executedCommands - The array of already executed commands.
 * @param {Command} context - The context of the command.
 * @return {boolean} Returns true if any command was executed, false otherwise.
 */
export async function executeCommands(
  remainingCommands: any[],
  executedCommands: string[],
): Promise<boolean> {
  for (const command of remainingCommands) {
    if (
      executedCommands.includes(command.name)
    ) {
      continue
    }

    if (
      command.dependencies.length === 0 ||
      dependenciesExecuted(command.dependencies, executedCommands)
    ) {
      if (command.concurrence) {
        executeCommand(command, executedCommands)
      } else if (
        dependenciesExecuted(command.dependencies, executedCommands)
      ) {
        await executeCommand(command, executedCommands)
      } else {
        continue
      }
    }

    executedCommands.push(command.name)
    return true
  }

  return false
}

/**
 * Checks if all dependencies are executed.
 *
 * @param {string[]} dependencies - The dependencies to check.
 * @param {string[]} executedCommands - The executed commands.
 * @return {boolean} True if all dependencies are executed, false otherwise.
 */
export function dependenciesExecuted(
  dependencies: string[],
  executedCommands: string[],
): boolean {
  return dependencies.every(dep => executedCommands.includes(dep))
}

/**
 * Handles missing dependencies by filtering the remaining commands based on whether their dependencies have been executed or not. It then logs an error message with the missing dependencies and the remaining commands.
 *
 * @param {any[]} remainingCommands - An array of remaining commands.
 * @param {string[]} executedCommands - An array of executed commands.
 * @param {any} context - The context object.
 * @return {void} This function does not return any value.
 */
export function handleMissingDependencies(
  remainingCommands: any[],
  executedCommands: string[],
  context: Command,
): void {
  const remainingCommandsNames = remainingCommands.map(
    command => command.name,
  )
  const missingDependencies = remainingCommands
  .filter(
    cmd =>
      cmd.dependencies.some(
        (dep: string) => !executedCommands.includes(dep),
      ),
  )
  .map(cmd => cmd.name)

  context.error(
    `Missing dependencies for commands: ${missingDependencies.join(', ')}`,
  )
  context.error(`Remaining commands: ${remainingCommandsNames.join(', ')}`)
}

/**
 * Returns the base directory for the application.
 *
 * @return {string} The base directory path.
 */
export function getBaseDir(): string {
  const homeFolder = homedir()
  const commanderDir = path.join(homeFolder, BASE_FOLDER_NAME)

  return commanderDir
}

export function getCommands(
  baseDir?: string,
): CommandContainerType[] {
  const commanderDir = baseDir ?? getBaseDir()
  const files = fs.readdirSync(commanderDir)
  const commands: CommandContainerType[] = []

  for (const file of files) {
    try {
      const command = require(path.join(commanderDir, file))
      commands.push(command)
    } catch {
      continue
    }
  }

  return commands
}

export function getCommand(
  commandName: string,
  baseDir?: string,
): CommandContainerType | null {
  const commanderDir = baseDir ?? getBaseDir()
  const files = fs.readdirSync(commanderDir)

  for (const file of files) {
    try {
      const command = require(path.join(commanderDir, file))
      if (command.name === commandName) {
        return command
      }
    } catch {
      continue
    }
  }

  return null
}

/**
 * Sorts an array of commands by dependency and logs the details of each command.
 *
 * @param {CommandType[]} commands - An array of commands to be sorted and logged.
 * @param {Command} context - The context of the commands.
 * @return {void} This function does not return a value.
 */
export function logCommands(commands: CommandType[], context: Command): void {
  // Sort commands by dependency (number of dependencies)
  commands.sort((a, b) => a.dependencies.length - b.dependencies.length)

  // Create a map to store nested commands
  const nestedCommands: { [key: string]: CommandType[] } = {}

  // Iterate through each command
  let index = 1
  for (const command of commands) {
    // Check if the command has dependencies
    if (command.dependencies.length > 0) {
      // Get the first dependency of the command
      const firstDependency = command.dependencies[0]

      // Check if the first dependency is already nested
      if (nestedCommands.hasOwnProperty(firstDependency)) {
        // Add the command to the nested commands
        nestedCommands[firstDependency].push(command)
      } else {
        // Create a new nested command array
        nestedCommands[firstDependency] = [command]
      }
    } else {
      // Log the command if it has no dependencies
      context.log(`Command ${index}:`)
      context.log(`Name: ${command.name}`)
      context.log(`Dependencies: ${command.dependencies.join(', ')}`)
      context.log(`Concurrence: ${command.concurrence}`)
      context.log(`Path: ${command.path}`)
      context.log(`Run Npm Install: ${command.runNpmInstall}`)
      context.log(`Check Out Branch: ${command.checkOutBranch}`)
      context.log('---------------------')
      index++
    }
  }

  // Log the nested commands recursively
  logNestedCommands(nestedCommands, context)
}

/**
 * Logs the nested commands of a given object.
 *
 * @param {Object} nestedCommands - An object containing nested commands.
 * @param {Command} context - The current command context.
 * @param {string} indent - The indentation string.
 * @return {void} This function does not return anything.
 */
export function logNestedCommands(nestedCommands: { [key: string]: CommandType[] }, context: Command, indent = ''): void {
  for (const dependency of Object.keys(nestedCommands)) {
    const commands = nestedCommands[dependency]
    console.log(`${indent}Dependency: ${dependency}`)
    let commandIndex = 1
    for (const command of commands) {
      console.log(`${indent}  Command ${commandIndex}:`)
      console.log(`${indent}  Name: ${command.name}`)
      console.log(`${indent}  Dependencies: ${command.dependencies.join(', ')}`)
      console.log(`${indent}  Concurrence: ${command.concurrence}`)
      console.log(`${indent}  Path: ${command.path}`)
      console.log(`${indent}  Run Npm Install: ${command.runNpmInstall}`)
      console.log(`${indent}  Check Out Branch: ${command.checkOutBranch}`)
      console.log(`${indent}  ---------------------`)

      // Recursively log nested commands
      logNestedCommands(nestedCommands, context, `${indent}  `)
      commandIndex++
    }
  }
}
