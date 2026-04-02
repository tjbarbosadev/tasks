import { SignOptions } from 'jsonwebtoken';

type AuthConfig = {
  jwt: {
    secret: string;
    expiresIn: SignOptions['expiresIn'];
  };
};

export const authConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'default',
    expiresIn: '1d',
  },
};
