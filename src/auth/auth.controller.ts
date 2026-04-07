import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  CreateStaffAccountDto,
  ActivateAccountDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/create-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ═══════════════════════════════════════════════
  // ROUTES PUBLIQUES
  // ═══════════════════════════════════════════════

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login avec email/username + mot de passe 6 chiffres' })
  @ApiResponse({ status: 200, description: 'Login réussi' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('activate')
  @Public()
  @ApiOperation({ summary: 'Activer un compte avec le token d\'invitation' })
  async activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activateAccount(dto);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  async refreshAccessToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  // ═══════════════════════════════════════════════
  // ROUTES PROTÉGÉES (JwtAuthGuard)
  // ═══════════════════════════════════════════════

  @Post('logout')
  @ApiOperation({ summary: 'Se déconnecter' })
  @ApiBearerAuth('access-token')
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer l\'utilisateur connecté' })
  @ApiBearerAuth('access-token')
  async getMe(@CurrentUser() user: any, @Query('include') include?: string) {
    return this.authService.getMe(user.id, include);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiBearerAuth('access-token')
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  // ═══════════════════════════════════════════════
  // ROUTES ADMIN UNIQUEMENT
  // ═══════════════════════════════════════════════

  @Post('staff')
  @Roles('admin')
  @ApiOperation({ summary: 'Créer un compte staff (admin/responsable/blog_manager)' })
  @ApiBearerAuth('access-token')
  async createStaffAccount(@CurrentUser() user: any, @Body() dto: CreateStaffAccountDto) {
    return this.authService.createStaffAccount(user.id, dto);
  }

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Lister les utilisateurs (paginé)' })
  @ApiBearerAuth('access-token')
  async listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    // TODO: Implémenter une vraie pagination
    return {
      data: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  @Patch('users/:id/suspend')
  @Roles('admin')
  @ApiOperation({ summary: 'Suspendre un utilisateur' })
  @ApiBearerAuth('access-token')
  async suspendUser(@Param('id') userId: string) {
    // TODO: Implémenter la suspension
    return { message: 'User suspended' };
  }

  @Patch('users/:id/reactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Réactiver un utilisateur suspendu' })
  @ApiBearerAuth('access-token')
  async reactivateUser(@Param('id') userId: string) {
    // TODO: Implémenter la réactivation
    return { message: 'User reactivated' };
  }

  @Delete('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiBearerAuth('access-token')
  async deleteUser(@Param('id') userId: string) {
    // TODO: Implémenter la suppression (soft delete)
    return { message: 'User deleted' };
  }
}
