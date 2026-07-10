import {PassThrough} from 'node:stream';
import type {AppLoadContext, EntryContext} from '@remix-run/node';
import {createReadableStreamFromReadable} from '@remix-run/node';
import {RemixServer} from '@remix-run/react';
import {renderToPipeableStream} from 'react-dom/server';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    const {pipe} = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          responseHeaders.set('Content-Type', 'text/html');
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          resolve(
            new Response(stream, {
              status: responseStatusCode,
              headers: responseHeaders,
            })
          );
          pipe(body);
        },
        onShellError: reject,
      }
    );
  });
}
