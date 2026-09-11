import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, type UserSummary } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateRoleDto } from './dto/update-role.dto';
import { toUserSummary } from './user-summary';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List every account (admin only)' })
  async list(): Promise<UserSummary[]> {
    const users = await this.users.findAll();
    return users.map(toUserSummary);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: "Change another account's role (admin only)" })
  async changeRole(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleDto,
  ): Promise<UserSummary> {
    const updated = await this.users.changeRole(actor.id, id, body.role);
    return toUserSummary(updated);
  }
}
