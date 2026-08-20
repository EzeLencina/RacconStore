import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Headers,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { PermissionGuard } from '@modules/authorization/presentation/guards/permission.guard';
import { VariantAppService } from '../../../services';
import {
  CreateVariantDto, UpdateVariantDto,
  ChangeSkuDto, ChangeStatusDto,
  UpdateAttributesDto, VariantListQueryDto,
} from '../dto';
import type { VariantResponseDto, PaginatedVariantResponseDto } from '../../../application/dto';

@Controller()
@UseGuards(AuthenticationGuard, PermissionGuard)
export class VariantController {
  constructor(private readonly variantAppService: VariantAppService) {}

  private getTenantId(headers: Record<string, string>): string {
    return headers['x-tenant-id'] || 'default';
  }

  @Post('api/v1/products/:productId/variants')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers() headers: Record<string, string>,
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand(tenantId, productId);
    return this.variantAppService.create(tenantId, productId, command);
  }

  @Get('api/v1/products/:productId/variants')
  async listByProduct(
    @Headers() headers: Record<string, string>,
    @Param('productId') productId: string,
    @Query() query: VariantListQueryDto,
  ): Promise<PaginatedVariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.listByProduct(productId, tenantId, query);
  }

  @Get('api/v1/variants/:id')
  async findById(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.findById(id, tenantId);
  }

  @Get('api/v1/variants/sku/:sku')
  async findBySku(
    @Headers() headers: Record<string, string>,
    @Param('sku') sku: string,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.findBySku(sku, tenantId);
  }

  @Patch('api/v1/variants/:id')
  async update(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand();
    return this.variantAppService.update(id, tenantId, command);
  }

  @Patch('api/v1/variants/:id/sku')
  async changeSku(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: ChangeSkuDto,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand();
    return this.variantAppService.changeSku(id, tenantId, command);
  }

  @Patch('api/v1/variants/:id/status')
  async changeStatus(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand();
    return this.variantAppService.changeStatus(id, tenantId, command);
  }

  @Patch('api/v1/variants/:id/attributes')
  async updateAttributes(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateAttributesDto,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.updateAttributes(id, tenantId, dto.attributes);
  }

  @Post('api/v1/variants/:id/default')
  @HttpCode(HttpStatus.OK)
  async setDefault(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body('productId') productId: string,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.setDefault(id, tenantId, productId);
  }

  @Post('api/v1/variants/:id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.archive(id, tenantId);
  }

  @Post('api/v1/variants/:id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<VariantResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.restore(id, tenantId);
  }

  @Delete('api/v1/variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = this.getTenantId(headers);
    return this.variantAppService.softDelete(id, tenantId);
  }
}
