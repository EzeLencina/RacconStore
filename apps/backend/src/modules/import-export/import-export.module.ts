import { Module } from '@nestjs/common';
import { LoggerModule } from '@tienda/logger/nest';
import { AuthorizationModule } from '@modules/authorization';
import { AuthenticationModule } from '@modules/authentication';
import { IMPORT_EXPORT_CONSTANTS } from './constants';
import { ImportExportService } from './application/import-export.service';
import { PendingImportStore } from './infrastructure/pending-import.store';
import { ImportExportController } from './presentation/controllers';

@Module({
  imports: [LoggerModule, AuthorizationModule, AuthenticationModule],
  controllers: [ImportExportController],
  providers: [
    ImportExportService,
    {
      provide: PendingImportStore,
      useValue: new PendingImportStore(IMPORT_EXPORT_CONSTANTS.PENDING_TTL_MS),
    },
  ],
  exports: [ImportExportService],
})
export class ImportExportModule {}