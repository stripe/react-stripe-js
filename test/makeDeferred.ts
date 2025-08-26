const makeDeferred = <T extends any>() => {
    let resolve!: (arg: T) => void;
    let reject!: (arg: any) => void;
    const promise: Promise<T> = new Promise((res: any, rej: any) => {
      resolve = jest.fn(res);
      reject = jest.fn(rej);
    });
    return {
      resolve: async (arg: T) => {
        resolve(arg);
        await new Promise(process.nextTick);
      },
      reject: async (failure: any) => {
        reject(failure);
        await new Promise(process.nextTick);
      },
      promise,
      getPromise: jest.fn(() => promise),
    };
  };
  export default makeDeferred;