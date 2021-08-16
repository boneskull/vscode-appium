import { window, workspace } from "vscode";
import resolveFrom from "resolve-from";
import { getConfig } from "./config";
import { getCurrentWorkspaceFolderUri } from "./workspace";
import readPkgUp from "read-pkg-up";
import path from "path";
import which from "which";
import execa from "execa";
import { LoggerService } from "./logger-service";
import {
  BUNDLED_APPIUM_EXECUTABLE_PATH,
  BUNDLED_APPIUM_VERSION,
} from "./constants";

/**
 * Options for {@link ResolverService}.
 */
export interface ResolverServiceOptions {
  /**
   * Instantiate for the singleton bundled Appium.
   */
  bundled: boolean;
}

let bundledAppium: ResolverService;

/**
 * A service for resolving the Appium executable.
 * If the workspace is untrusted, will return the singleton instance of
 * the bundled Appium.
 */
export class ResolverService {
  /**
   * If `true` use the bundled Appium.
   */
  private forceBundled: boolean = false;

  /**
   * Logger service.
   */
  private log: LoggerService;

  constructor(log: LoggerService, opts: Partial<ResolverServiceOptions> = {}) {
    this.log = log;
    this.forceBundled = !workspace.isTrusted;
  }

  /**
   * Search for Appium executable in this order:
   * 1. The user's configuration
   * 2. Local to the workspaces
   * 3. Global (in `PATH` or `PATHEXT`)
   * 4. Bundled
   * @param [workspaceFolderUri] - A workspace folder Uri. If unset, uses the current one
   * @returns A {@link AppiumExecutable} with the executable path and version
   */
  public async resolve(
    workspaceFolderUri = getCurrentWorkspaceFolderUri()
  ): Promise<AppiumExecutable> {
    const config = getConfig(workspaceFolderUri);
    const bundled = this.forceBundled || config.get("useBundledAppium");

    // force bundled
    if (bundled) {
      return {
        path: BUNDLED_APPIUM_EXECUTABLE_PATH,
        version: BUNDLED_APPIUM_VERSION,
      };
    }

    // search
    const serverDefaults = config.get("defaults.server");
    if (serverDefaults) {
      // try to use the user config
      this.log.debug("Retrieved server defaults: %O", serverDefaults);
      if ((serverDefaults as AppiumUserServerDefaults).executablePath) {
        try {
          const { path, version } = await this.assertAppiumPath(
            (serverDefaults as AppiumUserServerDefaults).executablePath
          );

          return { path, version };
        } catch {}
      }
    } else {
      this.log.debug(
        "ResolverService: No Appium server defaults config found in current workspace"
      );

      // try local
      if (window.activeTextEditor?.document) {
        const result = await this.resolveLocal(
          window.activeTextEditor.document.fileName
        );
        if (result?.path) {
          const { path, version } = result;
          this.log.info(
            "ResolverService: found local Appium v%s at %s",
            version,
            path
          );
          return { path, version };
        }
      }

      // try global
      const result = await this.resolveGlobal();
      if (result?.path) {
        const { path, version } = result;
        this.log.info(
          "ResolverService: found global Appium v%s at %s",
          version,
          path
        );
        return { path, version };
      }
    }
    // fallback to bundled
    const path = BUNDLED_APPIUM_EXECUTABLE_PATH;
    const version = BUNDLED_APPIUM_VERSION;
    this.log.info(
      "ResolverService: falling back to bundled Appium v%s at %s",
      version,
      path
    );
    return { path, version };
  }

  /**
   * Resolves an Appium executable from the FS local to the workspaces
   * @param fromDir - The directory to start searching from
   * @returns A {@link AppiumExecutable} with the executable path and version
   */
  protected async resolveLocal(fromDir: string) {
    let cwd = fromDir;
    let pkg;
    // search for package.json containing appium
    while ((pkg = await readPkgUp({ normalize: false, cwd }))) {
      this.log.debug(
        "ResolverService: searching in %s for `package.json` with an `appium` dependency",
        cwd
      );
      if (
        pkg.packageJson?.dependencies?.appium ||
        pkg.packageJson?.devDependencies?.appium
      ) {
        try {
          const localAppiumPath = ResolverService.resolveAppiumPathFrom(cwd);
          return this.assertAppiumPath(localAppiumPath);
        } catch {}
      }
      cwd = path.normalize(path.join(cwd, ".."));
    }
    this.log.debug(
      "ResolverService: could not find a `package.json` with an `appium` dependency"
    );
    // so if no package.json found, try to find appium in the same folder
    try {
      const localAppiumPath = ResolverService.resolveAppiumPathFrom(fromDir);
      return this.assertAppiumPath(localAppiumPath);
    } catch {}
  }

  /**
   * Resolves Appium executable installed globally
   * @returns A {@link AppiumExecutable} with the executable path and version
   */
  protected async resolveGlobal() {
    try {
      const executablePath = await which("appium");
      this.log.debug(
        "ResolverService: found global `appium` at %s",
        executablePath
      );
      return this.assertAppiumPath(await which("appium"));
    } catch {}
  }

  /**
   * Asserts that the Appium executable is valid by retrieving its version.
   * @param path - The path to the executable to validate
   * @returns A {@link AppiumExecutable} with the executable path and version
   */
  protected async assertAppiumPath(path: string): Promise<AppiumExecutable> {
    const { stdout: version } = await execa(path, ["--version"]);
    this.log.debug("ResolverService: found appium v%s at %s", version, path);
    return { version, path };
  }

  /**
   * Look in closest `node_modules` for the `appium` executable
   * @param fromDir - The dir to start searching from
   * @returns The nominal path to the `appium` executable
   */
  private static resolveAppiumPathFrom(fromDir: string) {
    return resolveFrom(fromDir, "appium");
  }
}
