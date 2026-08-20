import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Query,
  Res,
  Ip,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { PermissionGuard } from '@modules/authorization/presentation/guards/permission.guard';
import { RequirePermission } from '@modules/authorization/presentation/decorators/require-permission.decorator';
import { IMPORT_EXPORT_CONSTANTS } from '../../constants';
import { ImportExportService } from '../../application/import-export.service';
import type { ImportPreview, ImportResult } from '../../types/import-export.types';

type Actor = { id?: string; email?: string };

const EXPORT_PERMISSION = { resource: 'products', action: 'export' };
const IMPORT_PERMISSION = { resource: 'products', action: 'import' };

@Controller('api/v1/products')
@UseGuards(AuthenticationGuard, PermissionGuard)
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  @Get('export')
  @RequirePermission(EXPORT_PERMISSION)
  async export(
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<void> {
    const tenantId = headers['x-tenant-id'] || 'default';
    const filename = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await this.service.exportProducts(tenantId, { tenantId, status, search }, res);
    res.end();
  }

  @Post('import/preview')
  @RequirePermission(IMPORT_PERMISSION)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMPORT_EXPORT_CONSTANTS.MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  async preview(
    @Headers() headers: Record<string, string>,
    @Body('mode') mode?: string,
    @UploadedFile() file?: any,
    @Ip() ip?: string,
  ): Promise<ImportPreview> {
    if (!file?.path) {
      throw new BadRequestException('Archivo CSV requerido (campo "file")');
    }
    const tenantId = headers['x-tenant-id'] || 'default';
    const importMode = mode === 'CREATE' || mode === 'UPDATE' ? mode : 'UPSERT';
    return this.service.previewImport(
      tenantId,
      this.actor(headers),
      file.path,
      importMode,
      ip,
      headers['user-agent'],
    );
  }

  @Post('import/confirm')
  @RequirePermission(IMPORT_PERMISSION)
  async confirm(
    @Headers() headers: Record<string, string>,
    @Body('importId') importId?: string,
    @Ip() ip?: string,
  ): Promise<ImportResult> {
    if (!importId) {
      throw new BadRequestException('importId requerido');
    }
    const tenantId = headers['x-tenant-id'] || 'default';
    return this.service.confirmImport(tenantId, this.actor(headers), importId, ip, headers['user-agent']);
  }

  private actor(headers: Record<string, string>): Actor {
    const id = headers['x-user-id'];
    const email = headers['x-user-email'];
    return id || email ? { id, email } : {};
  }
}