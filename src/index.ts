import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';
import * as https from 'https';

export const mockable = (handlerToDecorate: APIGatewayProxyHandler) => {
  return async (event: APIGatewayProxyEvent, ...args: any[]): Promise<APIGatewayProxyResult> => {
    if (!event.headers || event?.headers['x-mock-via-accept'] === undefined) {
      return handlerToDecorate(event, args[0], args[1]) as Promise<APIGatewayProxyResult>;
    } else if (!process.env.ACCEPTJS_BACKEND) {
      return {
        statusCode: 500,
        body: 'ACCEPTJS_BACKEND environment variable is unset',
        headers: {
          'Access-Control-Allow-Origin': event.headers.origin ?? ''
        }
      };
    } else {
      const body = await new Promise<string>((resolve, reject) => {
        const postData = JSON.stringify({
          viaAccept: event?.headers['x-mock-via-accept'],
          resource: event.resource,
          pathParameters: event.pathParameters,
          body: event.body
        });
        const options = {
          hostname: process.env.ACCEPTJS_BACKEND,
          port: 443,
          path: '/api/v1/mock',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        const req = https.request(options, (msg) => {
          let response = '';
          msg.on('data', (chunk) => (response += chunk));
          msg.on('end', () => resolve(response));
        });
        req.on('error', (reason) => reject(reason));
        req.write(postData);
        req.end();
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
