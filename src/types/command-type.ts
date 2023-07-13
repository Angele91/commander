import {CommandStep} from './command-step'

export interface CommandType {
  name: string;
  steps: CommandStep[];
}
