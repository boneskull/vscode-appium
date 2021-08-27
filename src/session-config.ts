// import { Connection } from "webdriverio";
// import { URL } from "url";
// import { major } from "semver";
// import { instanceOfNodeError } from "./errors";

// export class SessionConfig {
//   private url: URL;
//   private _proxyURL?: URL;

//   public strictSSL: Connection["strictSSL"] = false;
//   public enableProxy: Connection["enableProxy"] = false;
//   public capabilities: Connection["capabilities"];
//   public port: Connection["port"];
//   public hostname: Connection["hostname"];
//   public path: Connection["path"];

//   static readonly DEFAULT_HOSTNAME = "127.0.0.1";
//   static readonly DEFAULT_PORT = "4723";

//   constructor(opts: Connection) {
//     this.strictSSL = opts.strictSSL ?? this.strictSSL;
//     this.proxyURL = opts.proxyURL ?? this.proxyURL;
//     this.port = opts.port;
//     this.hostname = opts.hostname;

//     this.path =
//       opts.appiumVersion && major(opts.appiumVersion) < 2
//         ? opts.path ?? "/wd/hub"
//         : opts.path ?? "/";
//     this.hostname = opts.hostname ?? SessionConfig.DEFAULT_HOSTNAME;
//     this.port = opts.port ?? SessionConfig.DEFAULT_PORT;
//     this.scheme = opts.enableSSL ? "https" : "http";
//     const port = opts.port ?? SessionConfig.DEFAULT_PORT;

// this.url = SessionConfig.createURL(
//   opts.url ?? `${scheme}://${hostname}:${port}${pathname}`,
//   {
//     username: opts.plainTextUsername,
//     password: opts.plainTextPassword,
//     search: opts.queryString,
//   }
// );

//     this.capabilities = opts.capabilities ?? {};
//   }

//   protected static create(opts: Connection) {
//     return new SessionConfig(opts);
//   }

//   get attachOptions() {}

//   get proxyURL() {
//     return this._proxyURL?.toString() ?? "";
//   }

//   set proxyURL(value: string | URL) {
//     this._proxyURL = value
//       ? SessionConfig.createURL(value.toString())
//       : undefined;
//   }

//   private static createURL(value: string | URL, props: Partial<URL> = {}) {
//     try {
//       const url = new URL(value.toString());
//       Object.assign(url, props);
//       return url;
//     } catch (err) {
//       if (
//         instanceOfNodeError(err, TypeError) &&
//         err.code === "ERR_INVALID_URL"
//       ) {
//         throw new TypeError(`"${value}" is not a valid URL!`);
//       }
//       throw err;
//     }
//   }
// }
