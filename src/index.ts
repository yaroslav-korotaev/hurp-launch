export interface App {
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface Log {
  info(message: string): void;
  fatal(obj: { err: Error }, message: string): void;
}

export type Main = () => Promise<App>;

export interface Options {
  log: Log;
}

export default async function launch(main: Main, options: Options): Promise<void> {
  const log = options.log;
  const fatal = (err: Error, message: string): void => {
    log.fatal({ err }, `${message}: ${err.message}`);
    process.exit(1);
  };
  
  process.on('uncaughtException', (err: Error) => fatal(err, 'uncaught exception'));
  process.on('unhandledRejection', (reason: {} | null | undefined, promise: Promise<any>) => {
    fatal(reason as Error, 'unhandled rejection');
  });
  
  try {
    const app = await main();
    
    await app.init();
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    log.info('online');
    
    async function shutdown(): Promise<void> {
      process.removeListener('SIGINT', shutdown);
      process.removeListener('SIGTERM', shutdown);
      
      try {
        await app.destroy();
        
        log.info('offline');
      } catch (err) {
        fatal(err as Error, 'shutdown failed');
      }
    }
  } catch (err) {
    fatal(err as Error, 'boot failed');
  }
}
