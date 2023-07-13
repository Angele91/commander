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

Once you define your steps, you can group them into a command, which is basically a set of related steps that can be executed together, in parallel, or in a predefined order. A command has a name and an array of steps.

You can then use Commander to execute your commands, either sequentially or in parallel, depending on your needs.

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


## FAQs

### Where are the commands located?

You should be able to find your commands, each one inside its own JSON file, in the `~/.commander` folder.

### What exactly is the "asynchronous" option when creating a new step?

It means it will not wait for other commands in the sequence to be completed. By default, all steps should be asynchronous, as disabling this will make the command to await until the previous command is executed. Disabling the asynchronous execution can be useful in some cases, but be aware that disabling it could cause strange things to happen.

### Can I add/ "XXX"?

I'd love to review and merge some new features made by you to this tool, so feel free to suggest anything on the issues section or just create a PR yourself.

### You could use "XXX" instead of this tool, didn't you know that?

I know there are a lot of other tools similar to this one, but I wanted to make mine, because I thought it would be fun. And it was. 

### I love cats!

Me too!

### The above was not exactly a question...

The above text wasn't neither a question.


## Contributing

Contributions are welcome! If you have any issues or feature requests, please open an issue on the [GitHub repository](https://github.com/Angele91/commander).

## License

Commander is open source software licensed under the MIT license.
