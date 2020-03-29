import { App, launch } from '../index';

async function flushPromises() {
  return new Promise(setImmediate);
}

function createApp(impl?: Partial<App>) {
  const noop = async () => {};
  
  return {
    init: jest.fn(impl && impl.init || noop),
    destroy: jest.fn(impl && impl.destroy || noop),
  };
}

function createMain(app: App) {
  return jest.fn(async () => app);
}

function createLog() {
  return {
    fatal() {},
    error() {},
    warn() {},
    info() {},
    debug() {},
    trace() {},
    child() {
      return createLog();
    },
  };
}

describe('launch', () => {
  beforeAll(() => {
    process.exit = jest.fn(() => {}) as any;
  });
  
  afterEach(() => {
    const processExit: jest.Mock = process.exit as any;
    processExit.mockClear();
  });
  
  test('boots an app', async () => {
    const app = createApp();
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    
    expect(main).toBeCalled();
    expect(app.init).toBeCalled();
  });
  
  test('catches boot error', async () => {
    const processExit: jest.Mock = process.exit as any;
    const app = createApp({
      async init() {
        throw new Error('fail');
      },
    });
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    
    expect(app.init).toBeCalled();
    expect(processExit).toBeCalled();
  });
  
  test('shutdowns an app', async () => {
    const app = createApp();
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    process.emit('SIGINT', 'SIGINT');
    await flushPromises();
    
    expect(app.destroy).toBeCalled();
  });
  
  test('catches shutdown error', async () => {
    const processExit: jest.Mock = process.exit as any;
    const app = createApp({
      async destroy() {
        throw new Error('fail');
      },
    });
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    process.emit('SIGINT', 'SIGINT');
    await flushPromises();
    
    expect(app.destroy).toBeCalled();
    expect(processExit).toBeCalled();
  });
  
  test('catches uncaughtException', async () => {
    const processExit: jest.Mock = process.exit as any;
    const app = createApp();
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    process.emit('uncaughtException', new Error('uncaught'));
    
    expect(processExit).toBeCalled();
  });
  
  test('catches unhandledRejection', async () => {
    const processExit: jest.Mock = process.exit as any;
    const app = createApp();
    const main = createMain(app);
    const log = createLog();
    
    await launch(main, { log });
    process.emit('unhandledRejection', new Error('unhandled'), new Promise(() => {}));
    
    expect(processExit).toBeCalled();
  });
});
