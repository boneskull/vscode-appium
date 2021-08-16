declare module 'appium' {
  import {Server} from 'http';
  namespace appium {
    function main(args?: object): Promise<Server>;
  }
  export = appium;
}
