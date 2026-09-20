import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserSummary } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateContactDto } from './dto/update-contact.dto';
import { toUserSummary } from './user-summary';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  @ApiOperation({ summary: "Change the signed-in account's display name, WhatsApp phone, language and country" })
  async update(@CurrentUser() actor: User, @Body() dto: UpdateContactDto): Promise<UserSummary> {
    return toUserSummary(await this.users.updateContact(actor, dto));
  }
}
