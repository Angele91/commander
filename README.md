# Commander CLI

Commander is a CLI tool that allows you to create, list, remove, and execute commands, that consists in a group of steps.
A step is basically a... _command_. But not like the one you manage through this CLI, but _literally_ a command. Like _cd_, _npm start_, or whatever.

## Purpose

The purpose of this CLI is to make it easier for developers to manage their commands. With Commander, you can create commands, add steps to the commands, in order to automate processes usually done manually.

## Installation

To use Commander, you need to clone the repository and link the package globally using npm:

```
git clone https://github.com/Angele91/commander.git
cd commander
npm link

```

or, you can install it through yarn or NPM

```
yarn add @angeleduardo/commander

// or

npm install @angeleduardo/commander
```

## How Commander works

Commander works by allowing you to define and execute commands, and add steps to them. A step is defined by a set of properties:

- **name**: The command that will be executed.
- **dependencies**: Which other commands need to be executed before this one to be able to execute.
- **concurrence**: If this command can be run in parallel with other commands.
- **runNpmInstall**: If an `npm install` or `yarn install` is needed before executing the command.
- **checkOutBranch**: If a `git checkout` is needed before executing the command.

You can then use Commander to execute commands, which will consist on a group of steps, executed either sequentially or in parallel, depending on your needs.

## Usage

Commander has the following commands:

### commander create [name]

This command creates a new command. It will request a name for the command you want to create and let you fill in the details for each command in the container.

### commander list

This command lists all the commands you have created.

### commander remove [name]

This command lets you delete an already created command.

### commander execute [name]

This command lets you execute a command.

### commander update [name]

This command lets you update a command.

## Contributing

Contributions are welcome! If you have any issues or feature requests, please open an issue on the [GitHub repository](https://github.com/Angele91/commander).

## License

Commander is open source software licensed under the MIT license.
