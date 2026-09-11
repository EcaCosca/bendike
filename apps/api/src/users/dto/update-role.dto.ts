import { ApiProperty } from '@nestjs/swagger';
import { Role, ROLES, type UpdateRoleRequest } from '@bendike/shared';
import { IsIn } from 'class-validator';

export class UpdateRoleDto implements UpdateRoleRequest {
  @ApiProperty({ enum: ROLES, example: Role.Rigger })
  @IsIn(ROLES)
  role!: Role;
}
