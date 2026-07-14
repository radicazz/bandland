export function normalizeEnvValue(value: string): string;
export function parseEnvContents(contents: string): Record<string, string>;
export function loadEnvFile(envFilePath: string): Promise<Record<string, string>>;
export function writePrivateFile(filePath: string, contents: string): Promise<void>;
export function normalizeEnvironment(value: string): "dev" | "prod";
export function normalizeHttpUrl(value: string, label: string): string;
export function normalizePort(value: string, label?: string): string;
export function isValidBcryptHash(value: string): boolean;
