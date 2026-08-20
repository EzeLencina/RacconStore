import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermission } from '@modules/authorization/presentation/decorators';
import { PermissionGuard } from '@modules/authorization/presentation/guards';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { ReviewAppService } from '../../services';
import { RecalculateProductReviewSummaryCommand } from '../../application/commands';

type AuthedRequest = Request & { user?: { userId?: string } };

@Controller('api/v1/admin/products/:productId/reviews')
@UseGuards(AuthenticationGuard, PermissionGuard)
export class AdminProductReviewsController {
  constructor(private readonly service: ReviewAppService) {}
  private tenant(req: AuthedRequest): string {
    const value = req.headers['x-tenant-id'];
    return typeof value === 'string' && value.length > 0 ? value : 'default';
  }
  @Post('recalculate') @RequirePermission({ resource: 'reviews', action: 'recalculate' }) recalculate(@Req() req: AuthedRequest, @Param('productId') productId: string) { return this.service.recalculateProductReviewSummary(new RecalculateProductReviewSummaryCommand(this.tenant(req), productId)); }
}