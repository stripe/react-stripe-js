import {PassThrough} from 'node:stream';
import type {AppLoadContext, EntryContext} from '@react-router/node';
import {createReadableStreamFromReadable} from '@react-router/node';
import {ServerRouter} from 'react-router';
import {renderToPipeableStream} from 'react-dom/server';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    const {pipe, abort} = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          const body = new PassThrough();
          responseHeaders.set('Content-Type', 'text/html');
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
      }
    );
    setTimeout(abort, 5000);
  });
}
