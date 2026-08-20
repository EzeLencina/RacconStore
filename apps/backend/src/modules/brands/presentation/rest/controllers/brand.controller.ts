import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { PermissionGuard } from '@modules/authorization/presentation/guards/permission.guard';
import { BrandAppService } from '../../../services';
import { CreateBrandDto, UpdateBrandDto, BrandListQueryDto } from '../dto';
import type { BrandResponseDto, PaginatedBrandResponseDto } from '../../../application/dto';

@Controller('brands')
@UseGuards(AuthenticationGuard, PermissionGuard)
export class BrandController {
  constructor(private readonly brandAppService: BrandAppService) {}

  private getTenantId(headers: Record<string, string>): string {
    return headers['x-tenant-id'] || 'default';
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers() headers: Record<string, string>,
    @Body() dto: CreateBrandDto,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand(tenantId);
    return this.brandAppService.create(tenantId, command);
  }

  @Get()
  async findAll(
    @Headers() headers: Record<string, string>,
    @Query() query: BrandListQueryDto,
  ): Promise<PaginatedBrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.findAll(tenantId, query);
  }

  @Get(':id')
  async findById(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.findById(id, tenantId);
  }

  @Get('slug/:slug')
  async findBySlug(
    @Headers() headers: Record<string, string>,
    @Param('slug') slug: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.findBySlug(slug, tenantId);
  }

  @Put(':id')
  async update(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    const command = dto.toCommand();
    return this.brandAppService.update(id, tenantId, command);
  }

  @Patch(':id/status')
  async changeStatus(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.changeStatus(id, tenantId, status);
  }

  @Patch(':id/visibility')
  async changeVisibility(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body('visibility') visibility: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.changeVisibility(id, tenantId, visibility);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.archive(id, tenantId);
  }

  @Patch(':id/restore')
  async restore(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<BrandResponseDto> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.restore(id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.softDelete(id, tenantId);
  }

  @Post(':brandId/products/:productId')
  @HttpCode(HttpStatus.OK)
  async assignToProduct(
    @Headers() headers: Record<string, string>,
    @Param('brandId') brandId: string,
    @Param('productId') productId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.assignToProduct(productId, brandId, tenantId);
  }

  @Delete(':brandId/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromProduct(
    @Headers() headers: Record<string, string>,
    @Param('productId') productId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId(headers);
    return this.brandAppService.removeFromProduct(productId, tenantId);
  }
}
