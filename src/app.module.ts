import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLAppModule } from './graphql/graphql.module';
type AppEnv = 'development' | 'production' | 'test';

export interface ConfigValidationSchemaType {
  PORT: number;
  APP_ENV: AppEnv;
  DB_CONNECTION: string;
  JWT_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SALT_LEVEL: number;
  EMAIL_VERIFICATION_URL: string;
  USER_INVITATION_URL: string;
  CHANGE_PASSWORD_URL: string;
}

const configValidationSchema = Joi.object({
  APP_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4444),
  DB_CONNECTION: Joi.string().required(),
  JWT_SECRET: Joi.string().default('secret'),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SALT_LEVEL: Joi.number().default(10),
  EMAIL_VERIFICATION_URL: Joi.string().default('http://localhost:3000/verify'),
  USER_INVITATION_URL: Joi.string().default('http://localhost:3000/invitation'),
  CHANGE_PASSWORD_URL: Joi.string().default(
    'http://localhost:3000/change-password',
  ),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      validationSchema: configValidationSchema,
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService<ConfigValidationSchemaType, true>,
      ) => ({
        uri: configService.get<string>('DB_CONNECTION'),
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService<ConfigValidationSchemaType, true>,
      ) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: () => ({
        autoSchemaFile: join(process.cwd(), './generated/schema.gql'),
        cors: true,
        formatError: (error) => {
          return error;
        },
      }),
    }),
    GraphQLAppModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
