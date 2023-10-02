/* eslint-disable @typescript-eslint/naming-convention */
/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface PolywrapManifest {
  /**
   * Polywrap manifest format version.
   */
  format: "0.6.0";
  /**
   * Basic project properties.
   */
  project: {
    /**
     * Name of this project.
     */
    name: string;
    /**
     * Type of this project.
     */
    type: string;
  };
  /**
   * Project source files.
   */
  source?: {
    /**
     * Path to the project's entry point.
     */
    module?: string;
    /**
     * Path to the project's graphql schema.
     */
    schema?: string;
    /**
     * Specify ABIs to be used for the import URIs within your schema.
     */
    import_abis?: ImportAbis[];
  };
  /**
   * Project resources folder
   */
  resources?: string;
  /**
   * Project extension manifest files.
   */
  extensions?: {
    /**
     * Path to the project build manifest file.
     */
    build?: string;
    /**
     * Path to the project docs manifest file.
     */
    docs?: string;
  };
  __type: "PolywrapManifest";
}
export interface ImportAbis {
  /**
   * One of the schema's import URI.
   */
  uri: string;
  /**
   * Path to a local ABI (or schema). Supported file formats: [*.graphql, *.info, *.json, *.yaml]
   */
  abi: string;
}