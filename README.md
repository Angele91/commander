# Commander CLI

Commander is a CLI tool that allows you to create, list, remove, and execute command containers.

## Purpose

The purpose of this CLI is to make it easier for developers to manage their commands. With Commander, you can group commands into containers, and execute them whenever you need to, saving time and effort.

## Installation

To use Commander, you need to clone the repository and link the package globally using npm:

```
git clone https://github.com/Angele91/commander.git
cd commander
npm link

```

## How Commander works

Commander works by allowing you to define and execute commands. A command is defined by a set of properties:

- **name**: The command that will be executed.
- **dependencies**: Which other commands need to be executed before this one to be able to execute.
- **concurrence**: If this command can be run in parallel with other commands.
- **runNpmInstall**: If an `npm install` or `yarn install` is needed before executing the command.
- **checkOutBranch**: If a `git checkout` is needed before executing the command.

Once you define your commands, you can group them into a command container, which is basically a set of related commands that can be executed together. A command container has a name and an array of commands.

You can then use Commander to execute your command containers, either sequentially or in parallel, depending on your needs.

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

## Contributing

Contributions are welcome! If you have any issues or feature requests, please open an issue on the [GitHub repository](https://github.com/yourusername/commander-cli).

## License

Commander is open source software licensed under the MIT license.