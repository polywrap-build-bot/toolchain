import { Command, Program } from "./types";
import {
  Compiler,
  PolywrapProject,
  SchemaComposer,
  Watcher,
  WatchEvent,
  watchEventName,
  intlMsg,
  defaultPolywrapManifest,
  parseWasmManifestFileOption,
  parseDirOption,
  parseClientConfigOption,
} from "../lib";
import { CodeGenerator } from "../lib/codegen/CodeGenerator";
import { CompilerCodegenStrategy } from "../lib/codegen/strategies/CompilerCodegenStrategy";
import { LocalBuildStrategy } from "../lib/source-builders/strategies/LocalStrategy";
import { DockerBuildStrategy } from "../lib/source-builders/strategies/DockerStrategy";

import path from "path";
import readline from "readline";
import { PolywrapClient, PolywrapClientConfig } from "@polywrap/client-js";
import { PolywrapManifest } from "@polywrap/polywrap-manifest-types-js";

const defaultOutputDir = "./build";
const defaultManifestStr = defaultPolywrapManifest.join(" | ");
const pathStr = intlMsg.commands_build_options_o_path();

type BuildCommandOptions = {
  manifestFile: string;
  outputDir: string;
  clientConfig: Partial<PolywrapClientConfig>;
  watch?: boolean;
  verbose?: boolean;
  docker?: boolean;
};

export const build: Command = {
  setup: (program: Program) => {
    program
      .command("build")
      .alias("b")
      .description(intlMsg.commands_build_description())
      .option(
        `-m, --manifest-file <${pathStr}>`,
        intlMsg.commands_build_options_m({
          default: defaultManifestStr,
        })
      )
      .option(
        `-o, --output-dir <${pathStr}>`,
        `${intlMsg.commands_build_options_o({
          default: defaultOutputDir,
        })}`
      )
      .option(
        `-c, --client-config <${intlMsg.commands_common_options_configPath()}>`,
        `${intlMsg.commands_common_options_config()}`
      )
      .option(`-n, --no-docker`, `${intlMsg.commands_build_options_n()}`)
      .option(`-w, --watch`, `${intlMsg.commands_build_options_w()}`)
      .option(`-v, --verbose`, `${intlMsg.commands_build_options_v()}`)
      .action(async (options) => {
        await run({
          ...options,
          manifestFile: parseWasmManifestFileOption(options.manifestFile),
          clientConfig: await parseClientConfigOption(options.clientConfig),
          outputDir: parseDirOption(options.outputDir, defaultOutputDir),
        });
      });
  },
};

async function validateManifestModules(polywrapManifest: PolywrapManifest) {
  if (
    polywrapManifest.project.type !== "interface" &&
    !polywrapManifest.source.module
  ) {
    const missingModuleMessage = intlMsg.lib_compiler_missingModule();
    throw Error(missingModuleMessage);
  }

  if (
    polywrapManifest.project.type === "interface" &&
    polywrapManifest.source.module
  ) {
    const noInterfaceModule = intlMsg.lib_compiler_noInterfaceModule();
    throw Error(noInterfaceModule);
  }
}

async function run(options: BuildCommandOptions) {
  const {
    watch,
    verbose,
    manifestFile,
    outputDir,
    clientConfig,
    docker,
  } = options;

  // Get Client
  const client = new PolywrapClient(clientConfig);

  const project = new PolywrapProject({
    rootDir: path.dirname(manifestFile),
    polywrapManifestPath: manifestFile,
    quiet: !verbose,
  });
  await project.validate();

  const polywrapManifest = await project.getManifest();
  await validateManifestModules(polywrapManifest);

  const buildStrategy = docker
    ? new DockerBuildStrategy({
        project,
        outputDir,
      })
    : new LocalBuildStrategy({
        project,
        outputDir,
      });

  const schemaComposer = new SchemaComposer({
    project,
    client,
  });

  const execute = async (): Promise<boolean> => {
    project.reset();
    schemaComposer.reset();

    const codegenStrategy = new CompilerCodegenStrategy({
      project,
      schemaComposer,
    });

    const codeGenerator = new CodeGenerator({ strategy: codegenStrategy });

    const compiler = new Compiler({
      project,
      outputDir,
      schemaComposer,
      sourceBuildStrategy: buildStrategy,
      codeGenerator,
    });

    const result = await compiler.compile();

    if (!result) {
      return result;
    }

    return true;
  };

  if (!watch) {
    const result = await execute();

    if (!result) {
      process.exitCode = 1;
      return;
    }
  } else {
    // Execute
    await execute();

    const keyPressListener = () => {
      // Watch for escape key presses
      console.log(
        `${intlMsg.commands_build_keypressListener_watching()}: ${project.getManifestDir()}`
      );
      console.log(intlMsg.commands_build_keypressListener_exit());
      readline.emitKeypressEvents(process.stdin);
      process.stdin.on("keypress", async (str, key) => {
        if (
          key.name == "escape" ||
          key.name == "q" ||
          (key.name == "c" && key.ctrl)
        ) {
          await watcher.stop();
          process.kill(process.pid, "SIGINT");
        }
      });

      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }

      process.stdin.resume();
    };

    keyPressListener();

    // Watch the directory
    const watcher = new Watcher();

    watcher.start(project.getManifestDir(), {
      ignored: [outputDir + "/**", project.getManifestDir() + "/**/wrap/**"],
      ignoreInitial: true,
      execute: async (events: WatchEvent[]) => {
        // Log all of the events encountered
        for (const event of events) {
          console.log(`${watchEventName(event.type)}: ${event.path}`);
        }

        // Execute the build
        await execute();

        // Process key presses
        keyPressListener();
      },
    });
  }

  process.exitCode = 0;
}
