import { PolywrapClientConfig } from "@polywrap/client-js";
import { ClientConfig, coreInterfaceUris } from "@polywrap/client-js";
import { ensPlugin } from "@polywrap/ens-plugin-js";
import { ethereumPlugin } from "@polywrap/ethereum-plugin-js";
import { ipfsPlugin } from "@polywrap/ipfs-plugin-js";

interface TestEnvironment {
  ipfs: string;
  ethereum: string;
  ensAddress: string;
  registrarAddress?: string;
  reverseAddress?: string;
  resolverAddress?: string;
  clientConfig: Partial<ClientConfig>;
}

async function getProviders(): Promise<TestEnvironment> {
  const ipfs = "http://localhost:5001";
  const ethereum = "http://localhost:8545";
  const ensAddress = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";

  const clientConfig: Partial<ClientConfig> = getPlugins(
    ethereum,
    ipfs,
    "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
  );
  return { ipfs, ethereum, ensAddress, clientConfig };
}

function getPlugins(
  ethereum: string,
  ipfs: string,
  ensAddress: string
): Partial<ClientConfig> {
  return {
    redirects: [],
    plugins: [
      {
        uri: "wrap://ens/ipfs.polywrap.eth",
        plugin: ipfsPlugin({ provider: ipfs }),
      },
      {
        uri: "wrap://ens/ens.polywrap.eth",
        plugin: ensPlugin({ addresses: { testnet: ensAddress } }),
      },
      {
        uri: "wrap://ens/ethereum.polywrap.eth",
        plugin: ethereumPlugin({
          networks: {
            testnet: {
              provider: ethereum,
            },
            MAINNET: {
              provider: "http://localhost:8546",
            },
          },
          defaultNetwork: "testnet",
        }),
      },
    ],
    interfaces: [
      {
        interface: coreInterfaceUris.uriResolver.uri,
        implementations: [
          "wrap://ens/ipfs.polywrap.eth",
          "wrap://ens/ens.polywrap.eth",
        ],
      },
      {
        interface: coreInterfaceUris.logger.uri,
        implementations: ["wrap://ens/js-logger.polywrap.eth"],
      },
    ],
  };
}

export async function getClientConfig(
  defaultConfigs: Partial<PolywrapClientConfig>
): Promise<Partial<PolywrapClientConfig>> {
  const { ipfs, ethereum, ensAddress } = await getProviders();
  return getPlugins(ethereum, ipfs, ensAddress);
}