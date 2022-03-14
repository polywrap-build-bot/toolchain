import { IpfsPlugin } from "./";
import { ResolveResult, Options, Query, Mutation, QueryEnv } from "./w3";

import { EResolveUriErrorType, ResolveUriError } from "@web3api/core-js";

const getOptions = (
  input: Options | undefined | null,
  env: QueryEnv
): Options => {
  const options = input || {};

  if (
    options.disableParallelRequests === undefined ||
    options.disableParallelRequests === null
  ) {
    options.disableParallelRequests = env.disableParallelRequests;
  }

  return options;
};

export const query = (ipfs: IpfsPlugin): Query.Module => ({
  catFile: async (input: Query.Input_catFile) => {
    const queryEnv = ipfs.getEnv("query") as QueryEnv;
    const options = getOptions(input.options, queryEnv);
    return await ipfs.cat(input.cid, options);
  },
  resolve: async (input: Query.Input_resolve): Promise<ResolveResult> => {
    const queryEnv = ipfs.getEnv("query") as QueryEnv;
    const options = getOptions(input.options, queryEnv);
    return await ipfs.resolve(input.cid, options);
  },
  // uri-resolver.core.web3api.eth
  tryResolveUri: async (input: Query.Input_tryResolveUri) => {
    const queryEnv = ipfs.getEnv("query") as QueryEnv;

    if (input.authority !== "ipfs") {
      return null;
    }

    let error: ResolveUriError | undefined;

    if (!IpfsPlugin.isCID(input.path)) {
      error = {
        type: EResolveUriErrorType.Ipfs,
        error: new Error("Ipfs CID is not valid"),
      };

      return { manifest: null, uri: null, error };
    }

    const manifestSearchPatterns = [
      "web3api.json",
      "web3api.yaml",
      "web3api.yml",
    ];

    let manifest: string | undefined;

    for (const manifestSearchPattern of manifestSearchPatterns) {
      try {
        manifest = await ipfs.catToString(
          `${input.path}/${manifestSearchPattern}`,
          {
            timeout: 5000,
            disableParallelRequests: queryEnv.disableParallelRequests,
          }
        );
      } catch (e) {
        error = {
          type: EResolveUriErrorType.Ipfs,
          error: e,
        };

        // TODO: logging
        // https://github.com/web3-api/monorepo/issues/33
      }
    }

    if (manifest) {
      return { uri: null, manifest };
    } else {
      // Noting found
      return { uri: null, manifest: null, error };
    }
  },
  getFile: async (input: Query.Input_getFile) => {
    const queryEnv = ipfs.getEnv("query") as QueryEnv;

    try {
      const { cid, provider } = await ipfs.resolve(input.path, {
        timeout: 5000,
        disableParallelRequests: queryEnv.disableParallelRequests,
      });

      return await ipfs.cat(cid, {
        provider,
        timeout: 20000,
        disableParallelRequests: true,
      });
    } catch (e) {
      return null;
    }
  },
});

export const mutation = (ipfs: IpfsPlugin): Mutation.Module => ({
  addFile: async (input: Mutation.Input_addFile) => {
    const { hash } = await ipfs.add(input.data);
    return hash.toString();
  },
});
