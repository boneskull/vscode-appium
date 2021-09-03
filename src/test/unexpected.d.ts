declare module 'unexpected' {
  interface Unexpected {
    (subj: any, assertion: string, ...args: any[]): Promise<void>;
    clone(): Unexpected;
  }

  const expect: Unexpected;
  export = expect;
}
