/* eslint-disable */
/**
 * This file was automatically generated by scripts/manifest/index-ts.mustache.
 * DO NOT MODIFY IT BY HAND. Instead, modify scripts/manifest/index-ts.mustache,
 * and run node ./scripts/manifest/generateFormatTypes.js to regenerate this file.
 */

import {
  DeployManifest as DeployManifest_0_1_0,
} from "./0.1.0";

export {
  DeployManifest_0_1_0,
};

export enum DeployManifestFormats {
  // NOTE: Patch fix for backwards compatability
  "v0.1" = "0.1",
  "v0.1.0" = "0.1.0",
}

export const DeployManifestSchemaFiles: Record<string, string> = {
  // NOTE: Patch fix for backwards compatability
  "0.1": "formats/polywrap.deploy/0.1.0.json",
  "0.1.0": "formats/polywrap.deploy/0.1.0.json",
}

export type AnyDeployManifest =
  | DeployManifest_0_1_0



export type DeployManifest = DeployManifest_0_1_0;

export const latestDeployManifestFormat = DeployManifestFormats["v0.1.0"]

export { migrateDeployManifest } from "./migrate";

export { deserializeDeployManifest } from "./deserialize";

export { validateDeployManifest } from "./validate";
