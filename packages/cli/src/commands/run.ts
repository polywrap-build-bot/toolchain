import { Command, Program } from "./types";
import {
  intlMsg,
  JobResult,
  JobRunner,
  Status,
  loadValidationScript,
  loadWorkflowManifest,
  parseClientConfigOption,
  parseWorkflowOutputFilePathOption,
  printJobOutput,
  validateJobNames,
  validateOutput,
  WorkflowOutput,
  defaultWorkflowManifest,
  parseManifestFileOption,
} from "../lib";
import { createLogger } from "./utils/createLogger";

import { PolywrapClient, PolywrapClientConfig } from "@polywrap/client-js";
import path from "path";
import yaml from "yaml";
import fs from "fs";

type WorkflowCommandOptions = {
  clientConfig: Partial<PolywrapClientConfig>;
  manifest: string;
  jobs?: string[];
  validationScript?: string;
  outputFile?: string;
  verbose?: boolean;
  quiet?: boolean;
};

const defaultManifestStr = defaultWorkflowManifest.join(" | ");
const pathStr = intlMsg.commands_run_options_m_path();

export const run: Command = {
  setup: (program: Program) => {
    program
      .command("run")
      .alias("r")
      .description(intlMsg.commands_run_description())
      .option(
        `-m, --manifest-file  <${pathStr}>`,
        intlMsg.commands_run_options_m({
          default: defaultManifestStr,
        })
      )
      .option(
        `-c, --client-config <${intlMsg.commands_common_options_configPath()}>`,
        `${intlMsg.commands_common_options_config()}`
      )
      .option(
        `-o, --output-file <${intlMsg.commands_run_options_outputFilePath()}>`,
        `${intlMsg.commands_run_options_outputFile()}`
      )
      .option(
        `-j, --jobs <${intlMsg.commands_run_options_jobIds()}...>`,
        intlMsg.commands_run_options_jobs()
      )
      .option("-v, --verbose", intlMsg.commands_common_options_verbose())
      .option("-q, --quiet", intlMsg.commands_common_options_quiet())
      .action(async (options) => {
        await _run({
          ...options,
          manifest: parseManifestFileOption(
            options.manifestFile,
            defaultWorkflowManifest
          ),
          clientConfig: await parseClientConfigOption(options.clientConfig),
          outputFile: options.outputFile
            ? parseWorkflowOutputFilePathOption(options.outputFile)
            : undefined,
        });
      });
  },
};

const _run = async (options: WorkflowCommandOptions) => {
  const { manifest, clientConfig, outputFile, verbose, quiet, jobs } = options;
  const logger = createLogger({ verbose, quiet });
  const client = new PolywrapClient(clientConfig);

  const manifestPath = path.resolve(manifest);
  const workflow = await loadWorkflowManifest(manifestPath, logger);
  validateJobNames(workflow.jobs);
  const validationScript = workflow.validation
    ? loadValidationScript(manifestPath, workflow.validation)
    : undefined;

  const workflowOutput: WorkflowOutput[] = [];

  const onExecution = (id: string, jobResult: JobResult) => {
    const { data, error, status } = jobResult;
    const output: WorkflowOutput = {
      id,
      status,
      data,
      error,
      validation: {
        status: Status.SKIPPED,
      },
    };

    if (validationScript) {
      validateOutput(output, validationScript, logger);
    }

    if (!quiet) {
      printJobOutput(output);
    }
    workflowOutput.push(output);
  };

  const jobRunner = new JobRunner(client, onExecution);
  await jobRunner.run(workflow.jobs, jobs ?? Object.keys(workflow.jobs));

  if (outputFile) {
    const outputFileExt = path.extname(outputFile).substring(1);
    if (!outputFileExt) throw new Error("Require output file extension");
    const printableOutput = workflowOutput.map((o) => ({
      ...o,
      error: o.error?.message,
    }));
    switch (outputFileExt) {
      case "yaml":
      case "yml":
        fs.writeFileSync(outputFile, yaml.stringify(printableOutput, null, 2));
        break;
      case "json":
        fs.writeFileSync(outputFile, JSON.stringify(printableOutput, null, 2));
        break;
      default:
        throw new Error(
          intlMsg.commands_run_error_unsupportedOutputFileExt({ outputFileExt })
        );
    }
  }
};
