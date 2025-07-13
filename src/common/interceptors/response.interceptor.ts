import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  result: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private logger = new Logger();
  private readonly configService = new (require('@nestjs/config').ConfigService)();

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;
    const req = context.switchToHttp().getRequest();
    const userDetail = req?.user || {};
    const env = this.configService.get('app.nodeEnv')

    return next.handle().pipe(
      map((data) => {
        let accessToken = null;
        if(data?.accessToken){
          accessToken = data?.accessToken;
          delete data?.accessToken;
        }

        const responsePayload = {
          isSuccess: statusCode >= 200 && statusCode < 300 ? true : false,
          statusCode: statusCode,
          error: '',
          message: data && data.message ? data.message : '',
          result:
            data && data.message
              ? { ...data, message: undefined }
              : data,
        };
        this.logger.debug(
          `Response: [${JSON.stringify(
            responsePayload,
          )}] || User Details: [${JSON.stringify(userDetail)}]`,
        );

        if (accessToken) {
          const twoYearsInMilliseconds = 2 * 365 * 24 * 60 * 60 * 1000;
          response.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: env==='production',
            maxAge: twoYearsInMilliseconds,
            expires: new Date(Date.now() + twoYearsInMilliseconds),
            sameSite: 'none'
          });
        }

        if (data?.clearCookies) {
          response.clearCookie('accessToken', {
            httpOnly: true,
            secure: env==='production',
          });
        }

        return responsePayload;
      }),
    );
  }
}
