import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { SubmitMembershipDto } from './dto/submit-membership.dto';
import { ReviewMembershipDto } from './dto/review-membership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Membership')
@Controller('membership')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  // ═══════════════════════════════════════════════
  // ROUTES PUBLIQUES
  // ═══════════════════════════════════════════════

  @Post('apply')
  @Public()
  @ApiOperation({ summary: 'Soumettre une demande d\'adhésion' })
  async submitApplication(@Body() dto: SubmitMembershipDto) {
    return this.membershipService.submitApplication(dto);
  }

  // ═══════════════════════════════════════════════
  // ROUTES ADMIN
  // ═══════════════════════════════════════════════

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Lister les demandes d\'adhésion' })
  @ApiBearerAuth('access-token')
  async listMemberships(
    @Query('status') status?: 'pending' | 'approved' | 'rejected' | 'suspended',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.membershipService.listMemberships({
      status,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Statistiques des adhésions' })
  @ApiBearerAuth('access-token')
  async getStats() {
    return this.membershipService.getStats();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Récupérer une demande d\'adhésion' })
  @ApiBearerAuth('access-token')
  async findById(@Param('id') id: string) {
    return this.membershipService.findById(id);
  }

  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approuver une demande d\'adhésion' })
  @ApiBearerAuth('access-token')
  async approveMembership(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewMembershipDto,
  ) {
    return this.membershipService.approveMembership(id, user.id, dto);
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiOperation({ summary: 'Rejeter une demande d\'adhésion' })
  @ApiBearerAuth('access-token')
  async rejectMembership(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewMembershipDto,
  ) {
    return this.membershipService.rejectMembership(id, user.id, dto);
  }
}
