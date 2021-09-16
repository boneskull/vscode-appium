# Appium Toolbox for VSCode

> A set of tools for [Appium][] servers

## Features

- Easily run local Appium servers
- Monitor server status
- Save and load server configurations
- Good feels

## Project Goals

The point of this project is to provide an interface to Appium _for developers_. Developers live in their IDEs, and [VS Code][] is certainly a popular one. We want to make it _as easy as possible_ for a developer to leverage Appium's automation capabilities--especially for the mobile web. I hear we all could stand to do a bit more testing in Safari iOS...

## Requirements

[Appium] is bundled with this extension. However, its prerequisites are not. Please see Appium's [getting started guide](http://appium.io/docs/en/about-appium/getting-started/index.html) for more information.

## Extension Settings

This extension contributes two sets of settings, which are described in detail via the UI:

- `appium.serverDefaults.*`: Defaults to use when running a local Appium server.
- `appium.sessionDefaults.*`: Defaults to use when creating saved sessions (`.appiumserver` files).

## Known Issues

**This extension should be considered an early alpha.** It is not feature-complete, nor is it well-tested. It probably won't hose your filesystem, but we make no promises.

## Roadmap

There's a lot to do, and a lot we _could_ do. What's the most useful thing this extension _doesn't_ do? Let's [discuss](https://github.com/boneskull/vscode-appium/issues/new).

- Implement server configuration like [Appium Inspector][] (including cloud vendors, etc.)
- Provide an example `.appiumserver` file
- Where it makes sense, provide commands for various Appium API endpoints.
- Greater focus on mobile web. What can we do here?
- Selenium Grid integration?
- Greater control over server monitoring behavior
- Interaction with the `appium` v2 CLI -- driver and plugin management
- More more more

### Anti-Roadmap

- [Appium Inspector][] provides a high level of interaction which we _don't_ need to implement.
- This isn't the place to make installing [Appium][]'s prerequisites easier, either.
- Other IDEs could use Appium plugins! Xcode and Android Studio (Jetbrains) might make a lot of sense! But not here.

## License

Authored by [Christopher Hiller](https://github.com/boneskull). Copyright 2021 [Sauce Labs](https://saucelabs.com). Licensed Apache-2.0

[vs code]: https://code.visualstudio.com/
[appium]: https://appium.io
[appium inspector]: https://github.com/appium/appium-inspector
