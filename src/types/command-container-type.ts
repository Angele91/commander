import {CommandType} from './command-type'

export interface CommandContainerType {
  name: string;
  commands: CommandType[];
}
