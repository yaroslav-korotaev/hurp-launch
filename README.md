# hurp-launch

[![npm](https://img.shields.io/npm/v/hurp-launch.svg?style=flat-square)](https://www.npmjs.com/package/hurp-launch)

An opinionated launcher for hurp-based applications.

Features:
- calls `init()` and `destroy()` on your App instance
- catches errors during boot and shutdown and immediately crashes the application
- listens for `uncaughtException` and `unhandledRejection` events and immediately crashes application in such case
- listens for `SIGINT` and `SIGTERM` process events to trigger a graceful shutdown of the application

## Installation

```bash
$ npm install hurp-launch
```

## Usage

```typescript
import pino from 'pino';
import { launch } from 'hurp-launch';
import { App } from './app';

const log = pino();

async function main() {
  return new App({ log });
}

launch(main, { log });
```

> There is no need to `.catch()` on `launch` function as it will internally call `process.exit(1)` on any errors

### Logger

Logger instance must be compatible with that interface:

```typescript
interface Log {
  info(message: string): void;
  fatal(obj: { err: Error }, message: string): void;
}
```

This approach is inspired by [Bunyan](https://github.com/trentm/node-bunyan). You can use a compatible logger like [pino](https://github.com/pinojs/pino) directly or write a simple wrapper around any other you like.

## API

### `async launch(main: Main, options: Options): Promise<void>`

```ts
import { launch } from 'hurp-launch';
```

Executes `main` function and launches the application instance it returned.

`main` - async function that return an App instance  
`options` - object containing options  
`options.log` - logger instance compatible with interface described above  
