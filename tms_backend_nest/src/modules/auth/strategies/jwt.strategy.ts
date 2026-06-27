import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_COOKIE_NAME } from '../auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          const cookieHeader = request?.headers?.cookie;
          if (!cookieHeader) {
            return null;
          }
          const match = cookieHeader
            .split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
          const value = match ? String(match.split('=')[1]) : null;
          return value ? decodeURIComponent(value) : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
