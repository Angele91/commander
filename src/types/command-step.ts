export interface CommandStep {
  name: string;
  instruction: string;
  dependencies: string[];
  concurrence: boolean;
  path: string;
  runNpmInstall: boolean;
  checkOutBranch: boolean;
}
