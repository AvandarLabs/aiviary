#!/usr/bin/env node
import { Acclimate } from "@avandar/acclimate";
import { GreetCli } from "./greet/greet.ts";

/**
 * The entry point: compose every command into one CLI and run it.
 *
 * Nothing else belongs here. Each command is its own Acclimate CLI in its own
 * module, so it can be read and tested without starting a process.
 */
const cli = Acclimate.createCLI("aiviary")
  .description("aiviary: a command-line tool.")
  .addCommand("greet", GreetCli);

Acclimate.run(cli);
