import { Body, Controller, Get, Param, Patch, Post, Delete, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermission } from '@modules/authorization/presentation/decorators';
import { PermissionGuard } from '@modules/authorization/presentation/guards';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { ReviewAppService } from '../../services';
import type { ReviewResponseRequestDto } from '../dto';
import { ApproveProductReviewCommand, ArchiveProductReviewCommand, HideProductReviewCommand, ListReviewsForModerationCommand, RejectProductReviewCommand, RestoreProductReviewCommand, UnhideProductReviewCommand, AddReviewResponseCommand, UpdateReviewResponseCommand, RemoveReviewResponseCommand, GetReviewByIdCommand } from '../../application/commands';

type AuthedRequest = Request & { user?: { userId?: string } };

@Controller('api/v1/admin/reviews')
@UseGuards(AuthenticationGuard, PermissionGuard)
export class AdminReviewsController {
  constructor(private readonly service: ReviewAppService) {}
  private tenant(req: AuthedRequest): string {
    const value = req.headers['x-tenant-id'];
    return typeof value === 'string' && value.length > 0 ? value : 'default';
  }
  @Get() @RequirePermission({ resource: 'reviews', action: 'manage' }) list(@Req() req: AuthedRequest) { return this.service.listReviewsForModeration(new ListReviewsForModerationCommand(this.tenant(req))); }
  @Get(':id') @RequirePermission({ resource: 'reviews', action: 'manage' }) get(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.getReviewById(new GetReviewByIdCommand(this.tenant(req), id)); }
  @Post(':id/approve') @RequirePermission({ resource: 'reviews', action: 'moderate' }) approve(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.approveProductReview(new ApproveProductReviewCommand(this.tenant(req), id)); }
  @Post(':id/reject') @RequirePermission({ resource: 'reviews', action: 'moderate' }) reject(@Req() req: AuthedRequest, @Param('id') id: string, @Body('reason') reason: string) { return this.service.rejectProductReview(new RejectProductReviewCommand(this.tenant(req), id, reason)); }
  @Post(':id/hide') @RequirePermission({ resource: 'reviews', action: 'hide' }) hide(@Req() req: AuthedRequest, @Param('id') id: string, @Body('reason') reason: string) { return this.service.hideProductReview(new HideProductReviewCommand(this.tenant(req), id, reason)); }
  @Post(':id/unhide') @RequirePermission({ resource: 'reviews', action: 'hide' }) unhide(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.unhideProductReview(new UnhideProductReviewCommand(this.tenant(req), id)); }
  @Post(':id/archive') @RequirePermission({ resource: 'reviews', action: 'archive' }) archive(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.archiveProductReview(new ArchiveProductReviewCommand(this.tenant(req), id)); }
  @Post(':id/restore') @RequirePermission({ resource: 'reviews', action: 'archive' }) restore(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.restoreProductReview(new RestoreProductReviewCommand(this.tenant(req), id)); }
  @Post(':id/response') @RequirePermission({ resource: 'reviews', action: 'respond' }) addResponse(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ReviewResponseRequestDto) { return this.service.addReviewResponse(new AddReviewResponseCommand(this.tenant(req), id, dto.content, req.user?.userId ?? 'admin')); }
  @Patch(':id/response') @RequirePermission({ resource: 'reviews', action: 'respond' }) updateResponse(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ReviewResponseRequestDto) { return this.service.updateReviewResponse(new UpdateReviewResponseCommand(this.tenant(req), id, dto.content)); }
  @Delete(':id/response') @RequirePermission({ resource: 'reviews', action: 'respond' }) removeResponse(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.removeReviewResponse(new RemoveReviewResponseCommand(this.tenant(req), id)); }
}