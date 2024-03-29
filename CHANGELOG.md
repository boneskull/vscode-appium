# CHANGELOG: Appium Toolbox for VS Code
### [0.0.6](https://github.com/boneskull/vscode-appium/compare/v0.0.5...v0.0.6) (2021-09-17)


### Bug Fixes

* **session:** sessions now have parents like they should ([719330d](https://github.com/boneskull/vscode-appium/commit/719330d53accc05a44b4a1a005825868309ded41))

### [0.0.5](https://github.com/boneskull/vscode-appium/compare/v0.0.4...v0.0.5) (2021-09-17)


### Bug Fixes

* **editor:** create new .appiumserver files with usable defaults ([4e26eb3](https://github.com/boneskull/vscode-appium/commit/4e26eb36bb0ecc52c0d6b3016e2feb6a55dde3ca))

### [0.0.4](https://github.com/boneskull/vscode-appium/compare/v0.0.3...v0.0.4) (2021-09-17)


### Bug Fixes

* **appium:** provide APPIUM_HOME properly ([f56236d](https://github.com/boneskull/vscode-appium/commit/f56236d3aff66fd07440c2c72d991060f6c40e8f))

### [0.0.3](https://github.com/boneskull/vscode-appium/compare/v0.0.2...v0.0.3) (2021-09-17)


### Bug Fixes

* **build:** correct bundling issues ([d6641fd](https://github.com/boneskull/vscode-appium/commit/d6641fde56adb86571bcb3dca0efa765db4cd058))

### [0.0.2](https://github.com/boneskull/vscode-appium/compare/v0.0.1...v0.0.2) (2021-09-16)


### Bug Fixes

* **build:** ts-results did not play well with esbuild, so moved it to external. ([49b077b](https://github.com/boneskull/vscode-appium/commit/49b077b2d301c814157b9895e2012f13fc5aab3e))
* **vscode:** fix task definition for running extension in dev mode ([bf6eca5](https://github.com/boneskull/vscode-appium/commit/bf6eca5d5467577ec213fbc90f435eefd068d4c6))

### 0.0.1 (2021-09-16)


### Features

* add a server/session config editor ([a3b75ee](https://github.com/boneskull/vscode-appium/commit/a3b75eecf5e12fca48b44cc34be816dbebb6b4dd))
* add polling refresh rate to extension config ([9c99aab](https://github.com/boneskull/vscode-appium/commit/9c99aaba0225951329541fe12a41db3e78e32989))
* building out tree view for servers ([e5a4f00](https://github.com/boneskull/vscode-appium/commit/e5a4f00fa53612198b3e1f990f3bad9f5a0eb9f4))
* custom editor for .appiumserver files ([b1f816b](https://github.com/boneskull/vscode-appium/commit/b1f816b400a787aa1ca68e03229435bc87e1f689))
* implement polling based on .appiumserver files ([6a5e339](https://github.com/boneskull/vscode-appium/commit/6a5e339a4dc2da728885bdc02242d674e870c75b))
* session screenshots ([930cc1b](https://github.com/boneskull/vscode-appium/commit/930cc1b871259e37e7e5e807e2a98673fb9eaadb))
* tasks seem to work ([fd1624d](https://github.com/boneskull/vscode-appium/commit/fd1624d23dd7245b45a5df33e77360411afb32b2))
* **treeview:** implement a basic tree view ([7fb3917](https://github.com/boneskull/vscode-appium/commit/7fb3917517d066c9db6d43c14947c664473eb49b))
* various features, services, etc. ([9292a34](https://github.com/boneskull/vscode-appium/commit/9292a34a4e1bad40115ddc00d90895affc88bb63))


### Bug Fixes

* **build:** attempt to fix path to logo ([1079b03](https://github.com/boneskull/vscode-appium/commit/1079b03fbd72073610547643e3f6e34c978ba2cf))
* **build:** move deps to devdeps for bundle ([08283de](https://github.com/boneskull/vscode-appium/commit/08283de56bc59ba6eda7f811682a87e1d6a4313d))
* **build:** rebuild package-lock.json, use real appium version ([ea681db](https://github.com/boneskull/vscode-appium/commit/ea681db7533cb63c1f939de3a17340006aef9daf))
* **build:** remove gen-schema-declarations from build ([45a507d](https://github.com/boneskull/vscode-appium/commit/45a507df83e89ada8a9b02480ca0e7db13904adf))
* **build:** sync vscode engine with @types/vscode version ([6eb6d62](https://github.com/boneskull/vscode-appium/commit/6eb6d62b165b3f5a8ba42bcce9d76e59db54a706))
* **gen-contribution-points:** don't add normalized metadata to the package.json ([a889567](https://github.com/boneskull/vscode-appium/commit/a88956713e3d95e11f7ac3e47e8ecc7b990d662d))
* **scripts:** update some wording, paths, etc ([fd047fa](https://github.com/boneskull/vscode-appium/commit/fd047fa4e15ae4ed0d54cb37fd23c0fd4c4c2aaf))
* **server-editor:** handle errors, return types correctly ([f3d5a63](https://github.com/boneskull/vscode-appium/commit/f3d5a63cfd66c743c0de12f5378e3bff8c7a3209))
* various problems with tasks and running local servers ([4ab6d7c](https://github.com/boneskull/vscode-appium/commit/4ab6d7c050d8654532cfe503fd7af72520b04549))
