import {
  Disposable,
  Pseudoterminal,
  Terminal,
  window,
  WorkspaceConfiguration,
} from "vscode";
import { LoggerService } from "./logger-service";
import { EventEmitter } from "vscode";
import { ExecaChildProcess, node as fork } from "execa";
import { getConfig } from "./config";
import { format } from "util";
import chalk from "chalk";
import { Readable } from "stream";
import { getCurrentWorkspaceFolderUri } from "./workspace";

enum TerminationKeycodes {
  ctrlC = "\x03",
  ctrlD = "\x04",
}

class AppiumProcess implements Disposable {
  private appium?: ExecaChildProcess;

  private constructor(
    private log: LoggerService,
    private executable: AppiumExecutable,
    private ptyWriter: NormalizingEventEmitter,
    private config: WorkspaceConfiguration
  ) {}

  private sendCommand(command: AppiumIPCCommand["command"], ...extra: any[]) {
    if (!this.appium || !this.appium.connected) {
      throw new ReferenceError("appium process not running");
    }
    // unsure of how to type this, so it's whatever it is.
    const msg = Object.assign({ type: "command", command }, ...extra);
    this.log.debug("Sending command: %O", msg);
    this.appium.send(msg);
  }

  activate() {
    if (this.appium) {
      return;
    }

    const appiumHome: string = this.config.get("appiumHome") as string;

    this.log.info(
      "Using command: node %s %s",
      require.resolve("./appium-wrapper"),
      this.executable.path
    );

    const appium = (this.appium = fork(
      require.resolve("./appium-wrapper"),
      [this.executable.path],
      {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
        env: {
          APPIUM_HOME: appiumHome ?? process.env.APPIUM_HOME,
        },
      }
    ));

    appium
      .on("message", (message: AppiumIPCMessage) => {
        switch (message.type) {
          case "ready":
            this.log.debug("subprocess ready");
            this.sendCommand("start", {
              args: this.config.get("defaults.server"),
            });
            break;
          case "fail":
            this.log.info("subprocess failed. reason: %s", message.reason);
            // todo notification
            break;
          case "started":
            const { details } = message;
            this.log.info(
              "Appium server running on %s:%s",
              details.address,
              details.port
            );
            break;
        }
      })
      .on("error", (err) => {
        this.log.error(err);
      })
      .on("close", () => {
        this.log.debug("subprocess closed");
      });

    // pass stdout/stderr to pty
    (appium.stdout as Readable).on("data", (data: Buffer) => {
      this.log.debug(data.toString());
      this.ptyWriter.fire(data.toString());
    });
    (appium.stderr as Readable).on("data", (data: Buffer) => {
      this.log.debug(data.toString());
      this.ptyWriter.fire(data.toString());
    });

    return this;
  }

  dispose() {
    this.ptyWriter.dispose();
    this.appium?.kill("SIGINT");
  }

  static create(
    log: LoggerService,
    executable: AppiumExecutable,
    ptyWriter: NormalizingEventEmitter,
    config: WorkspaceConfiguration
  ) {
    const appium = new AppiumProcess(log, executable, ptyWriter, config);
    return appium.activate();
  }
}

class NormalizingEventEmitter extends EventEmitter<string> {
  fire(data: string) {
    super.fire(data.replace(/\n/g, "\r\n"));
  }

  log(data: string) {
    this.fire(`${data}\r\n`);
  }
}

export class LocalServerService implements Disposable {
  private term?: Terminal;

  constructor(private log: LoggerService) {}

  async start(executable: AppiumExecutable) {
    const ptyWriter = new NormalizingEventEmitter();
    this.log.info(
      "Starting Appium server v%s at %s",
      executable.version,
      executable.path
    );
    const workspaceFolderUri = getCurrentWorkspaceFolderUri();
    const config = getConfig(workspaceFolderUri);

    const pty: Pseudoterminal = {
      onDidWrite: ptyWriter.event,
      open: () => {
        ptyWriter.log(
          format(
            chalk.dim("Starting Appium v%s at %s with options: %O"),
            executable.version,
            executable.path,
            config.get("defaults.server")
          )
        );
      },
      close: () => {
        // TODO should this dispose the ptyWriter?
      },
      handleInput: (data) => {
        if (
          data === TerminationKeycodes.ctrlC ||
          data === TerminationKeycodes.ctrlD
        ) {
          ptyWriter.log("Stopping local Appium server...");
          appium?.dispose();
          this.term?.dispose();
        } else {
          ptyWriter.fire(data);
        }
      },
    };

    this.term = window.createTerminal({
      name: "Appium Server",
      pty,
    });
    this.term.show();

    const appium = AppiumProcess.create(
      this.log,
      executable,
      ptyWriter,
      config
    );
  }

  dispose() {
    this.term?.dispose();
  }
}
