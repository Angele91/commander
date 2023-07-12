export interface CommandType {
  name: string;
  dependencies: string[];
  concurrence: boolean;
  path: string;
  runNpmInstall: boolean;
  checkOutBranch: boolean;
}
