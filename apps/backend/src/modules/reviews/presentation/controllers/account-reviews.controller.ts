import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermission } from '@modules/authorization/presentation/decorators';
import { PermissionGuard } from '@modules/authorization/presentation/guards';
import { AuthenticationGuard } from '@modules/authentication/presentation/guards/auth.guard';
import { ReviewAppService } from '../../services';
import type { CreateProductReviewRequestDto, UpdateProductReviewRequestDto, ReviewVoteRequestDto } from '../dto';
import { CreateProductReviewCommand, DeleteProductReviewCommand, GetCustomerReviewsCommand, GetReviewByIdCommand, UpdateProductReviewCommand, CastReviewVoteCommand, RemoveReviewVoteCommand } from '../../application/commands';

type AuthedRequest = Request & { user?: { userId?: string } };

@Controller('api/v1/account/reviews')
@UseGuards(AuthenticationGuard, PermissionGuard)
export class AccountReviewsController {
  constructor(private readonly service: ReviewAppService) {}
  private tenant(req: AuthedRequest): string {
    const value = req.headers['x-tenant-id'];
    return typeof value === 'string' && value.length > 0 ? value : 'default';
  }
  private customer(req: AuthedRequest): string { return req.user?.userId ?? ''; }
  @Post() @RequirePermission({ resource: 'reviews', action: 'create' }) create(@Req() req: AuthedRequest, @Body() dto: CreateProductReviewRequestDto) { return this.service.createProductReview(new CreateProductReviewCommand(this.tenant(req), this.customer(req), dto.productId, dto.rating, dto.content, dto.title ?? null, dto.productVariantId ?? null)); }
  @Get() @RequirePermission({ resource: 'reviews', action: 'read-own' }) list(@Req() req: AuthedRequest) { return this.service.getCustomerReviews(new GetCustomerReviewsCommand(this.tenant(req), this.customer(req))); }
  @Get(':id') @RequirePermission({ resource: 'reviews', action: 'read-own' }) get(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.getReviewById(new GetReviewByIdCommand(this.tenant(req), id)); }
  @Patch(':id') @RequirePermission({ resource: 'reviews', action: 'update-own' }) update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateProductReviewRequestDto) { return this.service.updateProductReview(new UpdateProductReviewCommand(this.tenant(req), this.customer(req), id, dto.rating, dto.title ?? null, dto.content)); }
  @Delete(':id') @RequirePermission({ resource: 'reviews', action: 'delete-own' }) remove(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.deleteProductReview(new DeleteProductReviewCommand(this.tenant(req), this.customer(req), id)); }
  @Post(':id/votes') castVote(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ReviewVoteRequestDto) { return this.service.castReviewVote(new CastReviewVoteCommand(this.tenant(req), id, dto.vote, this.customer(req), dto.guestFingerprintHash ?? null)); }
  @Delete(':id/votes') removeVote(@Req() req: AuthedRequest, @Param('id') id: string) { return this.service.removeReviewVote(new RemoveReviewVoteCommand(this.tenant(req), id, this.customer(req) || null)); }
}