import {
  buildAndDeployApi,
  initTestEnvironment,
  stopTestEnvironment,
} from "@web3api/test-env-js";
import { createWeb3ApiClient, Web3ApiClientConfig } from "..";
import { Client, Plugin, PluginModules } from "@web3api/core-js";
import { GetPathToTestApis } from "@web3api/test-cases";

jest.setTimeout(200000);

describe("Web3ApiClient", () => {
  let ipfsProvider: string;
  let ethProvider: string;
  let ensAddress: string;

  beforeAll(async () => {
    const { ipfs, ethereum, ensAddress: ens } = await initTestEnvironment();
    ipfsProvider = ipfs;
    ethProvider = ethereum;
    ensAddress = ens;
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  const getClient = async (config?: Partial<Web3ApiClientConfig>) => {
    return createWeb3ApiClient(
      {
        ethereum: {
          networks: {
            testnet: {
              provider: ethProvider,
            },
          },
        },
        ipfs: { provider: ipfsProvider },
        ens: {
          addresses: {
            testnet: ensAddress,
          },
        },
      },
      config
    );
  };

  const mockEnvPlugin = () => {
    class MockEnvPlugin extends Plugin {
      getModules(_client: Client): PluginModules {
        return {
          query: {
            sanitizeEnv: async (env: { arg1: string }) => {
              return { arg1: parseInt(env.arg1) };
            },
            queryEnv: () => {
              return this.getEnv("query");
            },
          },
          mutation: {
            sanitizeEnv: async (env: { arg1: number }) => {
              return { arg1: env.arg1.toString() };
            },
            mutationEnv: () => {
              return this.getEnv("mutation");
            },
          },
        };
      }
    }
    return {
      factory: () => new MockEnvPlugin(),
      manifest: {
        schema: ``,
        implements: [],
      },
    };
  };

  describe("env types", () => {
    let client: Client;
    let ensUri: string;

    beforeAll(async () => {
      const api = await buildAndDeployApi(
        `${GetPathToTestApis()}/env-types`,
        ipfsProvider,
        ensAddress
      );

      ensUri = `ens/testnet/${api.ensDomain}`;

      client = await getClient({
        envs: [
          {
            uri: ensUri,
            common: {
              object: {
                prop: "object string",
              },
              str: "string",
              optFilledStr: "optional string",
              number: 10,
              bool: true,
              en: "FIRST",
              array: [32, 23],
            },
            mutation: {
              mutStr: "mutation string",
            },
            query: {
              queryStr: "query string",
            },
          },
        ],
      });
    });

    test("query: tryGetEnv - when set", async () => {
      const queryEnv = await client.query({
        uri: ensUri,
        query: `
            query {
              tryGetEnv(
                arg: "string"
              )
            }
          `,
      });
      expect(queryEnv.errors).toBeFalsy();
      expect(queryEnv.data?.tryGetEnv).toEqual({
        str: "string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object string",
        },
        optObject: null,
        en: 0,
        optEnum: null,
        queryStr: "query string",
        array: [32, 23],
      });
    });

    test("query: tryGetEnv - when not set", async () => {
      const queryEnv = await client.query({
        uri: ensUri,
        query: `
            query {
              tryGetEnv(
                arg: "not set"
              )
            }
          `,
        config: {
          envs: [],
        },
      });
      expect(queryEnv.errors).toBeFalsy();
      expect(queryEnv.data?.tryGetEnv).toBeNull();
    });

    test("mutation: tryGetEnv - when set", async () => {
      const mutationEnv = await client.query({
        uri: ensUri,
        query: `
            mutation {
              tryGetEnv(
                arg: "string"
              )
            }
          `,
      });
      expect(mutationEnv.errors).toBeFalsy();
      expect(mutationEnv.data?.tryGetEnv).toEqual({
        str: "string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object string",
        },
        en: 0,
        optEnum: null,
        optObject: null,
        mutStr: "mutation string",
        array: [32, 23],
      });
    });

    test("mutation: tryGetEnv - when not set", async () => {
      const mutationEnv = await client.query({
        uri: ensUri,
        query: `
            mutation {
              tryGetEnv(
                arg: "not set"
              )
            }
          `,
        config: {
          envs: [],
        },
      });
      expect(mutationEnv.errors).toBeFalsy();
      expect(mutationEnv.data?.tryGetEnv).toBeNull();
    });

    test("query: getEnv - when set", async () => {
      const queryEnv = await client.query({
        uri: ensUri,
        query: `
            query {
              getEnv(
                arg: "string"
              )
            }
          `,
      });
      expect(queryEnv.errors).toBeFalsy();
      expect(queryEnv.data?.getEnv).toEqual({
        str: "string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object string",
        },
        optObject: null,
        en: 0,
        optEnum: null,
        queryStr: "query string",
        array: [32, 23],
      });
    });

    test("query: getEnv - when not set", async () => {
      const queryEnv = await client.query({
        uri: ensUri,
        query: `
            query {
              getEnv(
                arg: "not set"
              )
            }
          `,
        config: {
          envs: [],
        },
      });
      expect(queryEnv.data).toBeFalsy();
      expect(queryEnv.errors).toBeTruthy();
      expect(queryEnv.errors?.length).toBe(1);
      expect(queryEnv.errors?.[0].message).toBe("Undefined query env");
    });

    test("mutation: getEnv - when set", async () => {
      const mutationEnv = await client.query({
        uri: ensUri,
        query: `
            mutation {
              getEnv(
                arg: "string"
              )
            }
          `,
      });
      expect(mutationEnv.errors).toBeFalsy();
      expect(mutationEnv.data?.getEnv).toEqual({
        str: "string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object string",
        },
        en: 0,
        optEnum: null,
        optObject: null,
        mutStr: "mutation string",
        array: [32, 23],
      });
    });

    test("mutation: getEnv - when not set", async () => {
      const mutationEnv = await client.query({
        uri: ensUri,
        query: `
            mutation {
              getEnv(
                arg: "not set"
              )
            }
          `,
        config: {
          envs: [],
        },
      });
      expect(mutationEnv.data).toBeFalsy();
      expect(mutationEnv.errors).toBeTruthy();
      expect(mutationEnv.errors?.length).toBe(1);
      expect(mutationEnv.errors?.[0].message).toBe("Undefined mutation env");
    });

    test("query time env types", async () => {
      const queryEnv = await client.query({
        uri: ensUri,
        query: `
          query {
            getEnv(
              arg: "string"
            )
          }
        `,
      });
      expect(queryEnv.errors).toBeFalsy();
      expect(queryEnv.data?.getEnv).toEqual({
        str: "string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object string",
        },
        optObject: null,
        en: 0,
        optEnum: null,
        queryStr: "query string",
        array: [32, 23],
      });

      const queryUpdatedEnv = await client.query({
        uri: ensUri,
        query: `
          query {
            getEnv(
              arg: "string"
            )
          }
        `,
        config: {
          envs: [
            {
              uri: ensUri,
              common: {
                object: {
                  prop: "object another string",
                },
                str: "another string",
                optFilledStr: "optional string",
                number: 10,
                bool: true,
                en: "FIRST",
                array: [32, 23],
              },
              mutation: {
                mutStr: "mutation string",
              },
              query: {
                queryStr: "query string",
              },
            },
          ],
        },
      });
      expect(queryUpdatedEnv.errors).toBeFalsy();
      expect(queryUpdatedEnv.data?.getEnv).toEqual({
        str: "another string",
        optFilledStr: "optional string",
        optStr: null,
        number: 10,
        optNumber: null,
        bool: true,
        optBool: null,
        object: {
          prop: "object another string",
        },
        optObject: null,
        en: 0,
        optEnum: null,
        queryStr: "query string",
        array: [32, 23],
      });
    });
  });

  test("plugin env types", async () => {
    const implementationUri = "w3://ens/some-implementation.eth";
    const envPlugin = mockEnvPlugin();
    const client = await getClient({
      plugins: [
        {
          uri: implementationUri,
          plugin: envPlugin,
        },
      ],
      envs: [
        {
          uri: implementationUri,
          query: {
            arg1: "10",
          },
          mutation: {
            arg1: 11,
          },
        },
      ],
    });

    const queryEnv = await client.query({
      uri: implementationUri,
      query: `
        query {
          queryEnv
        }
        mutation {
          mutationEnv
        }
      `,
    });

    expect(queryEnv.errors).toBeFalsy();
    expect(queryEnv.data).toBeTruthy();
    expect(queryEnv.data?.queryEnv).toMatchObject({ arg1: 10 });
    expect(queryEnv.data?.mutationEnv).toMatchObject({ arg1: "11" });
  });

  test("env client types", async () => {
    const api = await buildAndDeployApi(
      `${GetPathToTestApis()}/env-client-types`,
      ipfsProvider,
      ensAddress
    );

    const ensUri = `ens/testnet/${api.ensDomain}`;
    const client = await getClient({
      envs: [
        {
          uri: ensUri,
          mutation: {
            str: "string",
          },
          query: {
            str: "string",
          },
        },
      ],
    });

    const queryEnv = await client.query({
      uri: ensUri,
      query: `
        query {
          environment(
            arg: "string"
          )
        }
      `,
    });
    expect(queryEnv.errors).toBeFalsy();
    expect(queryEnv.data?.environment).toEqual({
      str: "string",
      optStr: null,
      defStr: "default string",
    });

    const mutationEnv = await client.query({
      uri: ensUri,
      query: `
        mutation {
          mutEnvironment(
            arg: "string"
          )
        }
      `,
    });
    expect(mutationEnv.errors).toBeFalsy();
    expect(mutationEnv.data?.mutEnvironment).toEqual({
      str: "string",
      optStr: null,
      defMutStr: "default mutation string",
    });
  });
});