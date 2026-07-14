export type DataNamespace = "production" | "development";

export class ReadOnlyDeploymentError extends Error {
  constructor() {
    super("Preview deployments are read-only.");
    this.name = "ReadOnlyDeploymentError";
  }
}

export function getDataNamespace(): DataNamespace {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview"
    ? "production"
    : "development";
}

export function isReadOnlyDeployment() {
  return process.env.VERCEL_ENV === "preview";
}

export function requireWritableDeployment() {
  if (isReadOnlyDeployment()) {
    throw new ReadOnlyDeploymentError();
  }
}
