/* eslint-disable no-negated-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import {prompt} from 'inquirer'
import * as fs from 'node:fs'
import {join} from 'node:path'
import {CommandStep} from './types/command-step'
import {execSync} from 'node:child_process'
import {Command, ux} from '@oclif/core'
import {homedir} from 'node:os'
import path = require('node:path')
import {BASE_FOLDER_NAME} from './constants'
import {CommandType} from './types/command-type'
import {cloneDeep} from 'lodash'

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
 * Executes a step in a command.
 *
 * @param {CommandStep} step - The step to be executed.
 * @param {string[]} executedSteps - The list of steps that have been executed.
 * @return {Promise<void>} - A promise that resolves when the step has been executed.
 */
export async function executeStep(
  step: CommandStep,
  executedSteps: string[],
): Promise<void> {
  if (step.checkOutBranch) {
    const branchName = await prompt([{
      type: 'input',
      name: 'branchName',
      message: 'Write the branch name',
      default: 'main',
    }]).then(answer => answer.branchName)
    execSync('git fetch --all', {cwd: step.path, encoding: 'utf-8', stdio: 'inherit'})
    execSync('git pull', {cwd: step.path, encoding: 'utf-8', stdio: 'inherit'})
    execSync(`git checkout ${branchName}`, {cwd: step.path, encoding: 'utf-8', stdio: 'inherit'})
  }

  if (step.runNpmInstall) {
    try {
      // Run the step to check if yarn is installed
      execSync('yarn --version', {cwd: step.path})
      execSync('yarn install', {cwd: step.path, encoding: 'utf-8', stdio: 'inherit'})
    } catch {
      execSync('npm install', {cwd: step.path, encoding: 'utf-8', stdio: 'inherit'})
    }
  }

  execSync(step.instruction, {
    cwd: step.path,
    encoding: 'utf-8',
    stdio: 'inherit',
  })

  executedSteps.push(step.name)
}

/**
 * Executes a series of steps.
 *
 * @param {any[]} remainingSteps - An array of steps that are yet to be executed.
 * @param {string[]} executedSteps - An array of steps that have already been executed.
 * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the steps were successfully executed.
 */
export async function executeSteps(
  remainingSteps: any[],
  executedSteps: string[],
): Promise<boolean> {
  for (const step of remainingSteps) {
    if (
      executedSteps.includes(step.name)
    ) {
      continue
    }

    if (
      step.dependencies.length === 0 ||
      dependenciesExecuted(step.dependencies, executedSteps)
    ) {
      if (step.concurrence) {
        executeStep(step, executedSteps)
      } else {
        await executeStep(step, executedSteps)
      }

      executedSteps.push(step.name)
      return true
    }
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
 * Handles missing dependencies for the given command.
 *
 * @param {any[]} remainingSteps - The array of remaining steps.
 * @param {string[]} executedSteps - The array of executed steps.
 * @param {Command} context - The command context.
 * @return {void} This function does not return a value.
 */
export function handleMissingDependencies(
  remainingSteps: any[],
  executedSteps: string[],
  context: Command,
): void {
  const remainingStepNames = remainingSteps.map(
    command => command.name,
  )
  const missingDependencies = remainingSteps
  .filter(
    cmd =>
      cmd.dependencies.some(
        (dep: string) => !executedSteps.includes(dep),
      ),
  )
  .map(cmd => cmd.name)

  context.log(
    `Missing dependencies for commands: ${missingDependencies.map(step => step.name).join(', ')}`,
  )
  context.log(`Remaining commands: ${remainingStepNames.map(step => step.name).join(', ')}`)
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
): CommandType[] {
  const commanderDir = baseDir ?? getBaseDir()
  const files = fs.readdirSync(commanderDir)
  const commands: CommandType[] = []

  for (const file of files) {
    try {
      const rawCommand = fs.readFileSync(path.join(commanderDir, file), {encoding: 'utf-8'})
      const command = JSON.parse(rawCommand) as CommandType
      commands.push(command)
    } catch (error: any) {
      console.error(error)
      continue
    }
  }

  return commands
}

export function getCommand(
  commandName: string,
  baseDir?: string,
): CommandType | null {
  const commanderDir = baseDir ?? getBaseDir()
  const files = fs.readdirSync(commanderDir)

  for (const file of files) {
    try {
      const rawCommand = fs.readFileSync(path.join(commanderDir, file), {encoding: 'utf-8'})
      const command = JSON.parse(rawCommand) as CommandType
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
 * Sorts the given array of `CommandStep` objects based on the number of dependencies they have,
 * and logs the steps and their details using the provided `Command` context.
 *
 * @param {CommandStep[]} steps - The array of `CommandStep` objects to be sorted and logged.
 * @param {Command} context - The `Command` context object used for logging the steps.
 * @returns {void}
 */
export function logSteps(steps: CommandStep[], context: Command): void {
  steps.sort((a, b) => a.dependencies.length - b.dependencies.length)

  const nestedSteps: { [key: string]: CommandStep[] } = {}

  for (const step of steps) {
    if (step.dependencies.length > 0) {
      const firstDependency = step.dependencies[0]

      if (nestedSteps[firstDependency]) {
        nestedSteps[firstDependency].push(step)
      } else {
        nestedSteps[firstDependency] = [step]
      }
    } else {
      context.log(`Step: ${step.name}`)
      context.log(`Dependencies: ${step.dependencies.join(', ')}`)
      context.log(`Concurrence: ${step.concurrence}`)
      context.log(`Path: ${step.path}`)
      context.log(`Run Npm Install: ${step.runNpmInstall}`)
      context.log(`Check Out Branch: ${step.checkOutBranch}`)
      context.log('---------------------')
    }
  }

  // Log the nested commands recursively
  logNestedSteps(nestedSteps, context)
}

/**
 * Logs the nested steps of a command.
 *
 * @param {Object<string, CommandStep[]>} nestedSteps - The nested steps of the command.
 * @param {Command} context - The command context.
 * @param {string} indent - The indentation string.
 * @return {void} This function does not return anything.
 */
export function logNestedSteps(nestedSteps: { [key: string]: CommandStep[] }, context: Command, indent = ''): void {
  for (const dependency of Object.keys(nestedSteps)) {
    const commands = nestedSteps[dependency]
    console.log(`${indent}Dependency: ${dependency}`)
    for (const command of commands) {
      console.log(`${indent}  Name: ${command.name}`)
      console.log(`${indent}  Dependencies: ${command.dependencies.join(', ')}`)
      console.log(`${indent}  Concurrence: ${command.concurrence}`)
      console.log(`${indent}  Path: ${command.path}`)
      console.log(`${indent}  Run Npm Install: ${command.runNpmInstall}`)
      console.log(`${indent}  Check Out Branch: ${command.checkOutBranch}`)
      console.log(`${indent}  ---------------------`)

      logNestedSteps(nestedSteps, context, `${indent}  `)
    }
  }
}

export async function createStep(
  step?: CommandStep,
  otherSteps?: CommandStep[],
): Promise<CommandStep> {
  let currentPath = process.cwd()

  let dependencies = [] as string[]

  const name = await prompt([{
    type: 'input',
    name: 'name',
    message: 'Write the step name',
    default: step?.name,
    validate: (value: string) => {
      if (value.length < 3) {
        return 'Step name must be at least 3 characters long'
      }

      if (otherSteps?.some(cmd => cmd.name === value)) {
        return 'That step already exists'
      }

      return true
    },
  }]).then(answer => answer.name)

  const instruction = await prompt([{
    type: 'input',
    name: 'name',
    message: 'Write the command to execute in this step',
  }]).then(answer => answer.name)

  if ((otherSteps?.length ?? 0) > 0) {
    dependencies = await prompt([{
      type: 'checkbox',
      name: 'dependencies',
      message: `[${name}] Select the steps that should be executed before this one`,
      choices: otherSteps?.map(cmd => cmd.name),
      default: step?.dependencies,
    }]).then(answer => answer.dependencies)
  }

  const concurrence = await prompt([{
    type: 'confirm',
    name: 'concurrence',
    message: `[${name}] Should this step be executed asynchronously?`,
    default: step?.concurrence,
  }]).then(answer => answer.concurrence)

  const executeInCurrentPath = await prompt([{
    type: 'confirm',
    name: 'executeInCurrentPath',
    message: `[${name}] Should this step be executed in the current path?`,
    default: step === undefined ? true : step?.path === currentPath,
  }]).then(answer => answer.executeInCurrentPath)

  if (!executeInCurrentPath) {
    currentPath = await findPath()
  }

  // Check if the directory has a .git directory
  const hasGitDirectory = fs.existsSync(path.join(currentPath, '.git'))
  let checkOutBranch = false

  if (hasGitDirectory) {
    checkOutBranch = await prompt([{
      type: 'confirm',
      name: 'checkOutBranch',
      message: `[${name}] Should this step check out to a branch before execution?`,
      default: step?.checkOutBranch,
    }]).then(answer => answer.checkOutBranch)
  }

  // Check if the directory has a package.json file
  const hasPackageJson = fs.existsSync(path.join(currentPath, 'package.json'))
  let runNpmInstall = false

  if (hasPackageJson) {
    runNpmInstall = await prompt([{
      type: 'confirm',
      name: 'runNpmInstall',
      message: `[${name}] Should this step run npm install before execution?`,
      default: step?.runNpmInstall,
    }]).then(answer => answer.runNpmInstall)
  }

  return {
    name,
    instruction,
    dependencies,
    concurrence,
    path: currentPath,
    runNpmInstall,
    checkOutBranch,
  }
}

export async function createCommand(): Promise<CommandType> {
  const commands = getCommands()

  const name = await prompt([{
    type: 'input',
    name: 'name',
    message: 'Write the command name',
    default: 'command',
    validate: (value: string) => {
      if (value.length < 3) {
        return 'Command name must be at least 3 characters long'
      }

      if (commands.some(cmd => cmd.name === value)) {
        return 'That command already exists'
      }

      return true
    },
  }]).then(answer => answer.name)

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

  return command
}

/**
 * Prompts the user to update the name of the given command.
 *
 * @param {CommandType} command - The command to update.
 * @return {Promise<string>} A promise that resolves to the updated name.
 */
async function updateCommandName(command: CommandType): Promise<string> {
  const name = await prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Write the command name',
      default: command.name,
      validate: (value: string) => {
        if (value.length < 3) {
          return 'Command name must be at least 3 characters long'
        }

        if (getCommands().some(cmd => cmd.name === value)) {
          return 'That command already exists'
        }

        return true
      },
    },
  ]).then(answer => answer.name)

  return name
}

/**
 * Asynchronously selects a step to update based on a given command.
 *
 * @param {CommandType} command - The command object containing the steps.
 * @return {Promise<{ index: number, step: CommandStep; }>} A promise that resolves to the selected step.
 */
async function selectStepToUpdate(command: CommandType): Promise<{ index: number; step: CommandStep }> {
  const stepToUpdate = await prompt([
    {
      type: 'list',
      name: 'stepToUpdate',
      message: 'Which step do you want to update?',
      choices: [
        ...command.steps.map(step => step.name),
        {
          name: 'Add new step',
          value: '__ADD_NEW_STEP',
        },
      ],
    },
  ]).then(answer => answer.stepToUpdate)

  if (stepToUpdate === '__ADD_NEW_STEP') {
    const step = await createStep(undefined, command.steps)

    return {index: -1, step}
  }

  const stepIndex = command.steps.findIndex(step => step.name === stepToUpdate)

  return {index: stepIndex, step: command.steps[stepIndex]}
}

/**
 * Prompts the user to update the given step.
 *
 * @param {CommandStep} step - The step to update.
 * @param {CommandStep[]} otherSteps - The other steps in the command.
 * @return {Promise<CommandStep>} A promise that resolves to the updated step.
 */
async function updateStep(step: CommandStep, otherSteps: CommandStep[]): Promise<CommandStep> {
  const updatedStep = await createStep(step, otherSteps.filter(cmd => cmd.name !== step.name))

  return updatedStep
}

/**
 * Updates a command.
 *
 * @param {CommandType} originalCommand - The original command to update.
 * @return {Promise<CommandType>} - The updated command.
 */
export async function updateCommand(originalCommand: CommandType): Promise<CommandType> {
  const commanderDir = getBaseDir()
  const command = cloneDeep(originalCommand)

  while (true) {
    const whatToUpdate = await prompt([
      {
        type: 'list',
        name: 'whatToUpdate',
        message: 'What do you want to update?',
        choices: ['Name', 'Steps', 'Exit'],
      },
    ]).then(answer => answer.whatToUpdate)

    if (whatToUpdate === 'Exit') {
      break
    }

    if (whatToUpdate === 'Name') {
      const name = await updateCommandName(command)
      ux.action.start('Updating command name')
      fs.renameSync(join(commanderDir, command.name), join(commanderDir, name))
      command.name = name
      ux.action.stop()
    }

    if (whatToUpdate === 'Steps') {
      const {index, step} = await selectStepToUpdate(command)

      if (!step) {
        continue
      }

      if (index === -1) {
        command.steps.push(step)

        ux.action.start('Updating step')
        fs.writeFileSync(join(commanderDir, command.name), JSON.stringify(command, null, 2))
        ux.action.stop()
        continue
      }

      const updatedStep = await updateStep(step, command.steps)

      command.steps[index] = updatedStep

      ux.action.start('Updating step')
      fs.writeFileSync(join(commanderDir, command.name), JSON.stringify(command, null, 2))
      ux.action.stop()
    }
  }

  return command
}

