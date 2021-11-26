import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { mockable } from './index';

describe('mockable decorator', () => {
  it('should be able to wrap an async arrow function', async () => {
    const handler = mockable(async (event:APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      return {
        statusCode: 200,
        body: ''
      };
    });
    const returnValue = await handler({} as APIGatewayProxyEvent);
    expect(returnValue.statusCode).toEqual(200);
  });
});
