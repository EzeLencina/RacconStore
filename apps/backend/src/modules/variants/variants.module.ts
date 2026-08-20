import { Module } from '@nestjs/common';
import { LoggerModule } from '@tienda/logger/nest';
import { PrismaClient } from '@tienda/database';
import { AuthorizationModule } from '@modules/authorization';
import { AuthenticationModule } from '@modules/authentication';
import { VariantController } from './presentation';
import { VARIANT_PROVIDERS } from './providers';
import { VariantAppService } from './services';
import { VariantEventHandler } from './events';

@Module({
  imports: [LoggerModule, AuthorizationModule, AuthenticationModule],
  controllers: [VariantController],
  providers: [
    ...VARIANT_PROVIDERS,
    VariantEventHandler,
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [VariantAppService],
})
export class VariantsModule {}
