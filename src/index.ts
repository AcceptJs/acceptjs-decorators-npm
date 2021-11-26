import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Callback
} from 'aws-lambda';
import * as https from 'https';

export const mockable = (handlerToDecorate: APIGatewayProxyHandler) => {
  return async (
    event: APIGatewayProxyEvent,
    context: Context,
    callback: Callback<APIGatewayProxyResult>
  ) => {
    if (event.headers['x-mock-via-accept'] === undefined) {
      return handlerToDecorate(event, context, callback);
    } else {
      if (!process.env.ACCEPTJS_BACKEND) {
        return {
          statusCode: 500,
          body: 'ACCEPTJS_BACKEND environment variable is unset',
          headers: {
            'Access-Control-Allow-Origin': event.headers.origin ?? ''
          }
        };
      }

      const body = await new Promise<string>((resolve, reject) => {
        const options = {
          hostname: process.env.ACCEPTJS_BACKEND,
          port: 443,
          path: '/api/v1/core/mock',
          method: 'GET'
        };
        https
          .request(options, (msg) => {
            let response = '';
            msg.on('data', (chunk) => (response += chunk));
            msg.on('end', () => resolve(response));
          })
          .on('error', (reason) => reject(reason))
          .end();
      });

      return {
        statusCode: 200,
        body,
        headers: {
          'Access-Control-Allow-Origin': event.headers.origin ?? ''
        }
      };
    }
  };
};
