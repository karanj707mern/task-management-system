import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  DefaultValuePipe,
  Param,
  ParseEnumPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamsQueryDto } from '@/common/dto/pagination-query.dto';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { TeamMemberRole, UserRole } from '@prisma/client';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async createTeam(@Body() createTeamDto: CreateTeamDto, @GetUser('role') role: UserRole) {
    return this.teamsService.createTeam(createTeamDto, role);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async getAllTeams(@Query() query: TeamsQueryDto) {
    return this.teamsService.getAllTeams(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getTeam(@Param('id', ParseCuidPipe) id: string, @GetUser('role') role: UserRole) {
    return this.teamsService.getTeam(id, role);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async updateTeam(
    @Param('id', ParseCuidPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @GetUser('role') role: UserRole,
  ) {
    return this.teamsService.updateTeam(id, updateTeamDto, role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async deleteTeam(@Param('id', ParseCuidPipe) id: string, @GetUser('role') role: UserRole) {
    return this.teamsService.deleteTeam(id, role);
  }

  @Post(':id/members/:userId')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async addMember(
    @Param('id', ParseCuidPipe) teamId: string,
    @Param('userId', ParseCuidPipe) userId: string,
    @Body('role', new DefaultValuePipe(TeamMemberRole.MEMBER), new ParseEnumPipe(TeamMemberRole)) memberRole: TeamMemberRole,
    @GetUser('role') role: UserRole,
  ) {
    return this.teamsService.addMemberToTeam(teamId, userId, role, memberRole);
  }

  @Patch(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async updateMemberRole(
    @Param('id', ParseCuidPipe) teamId: string,
    @Param('userId', ParseCuidPipe) userId: string,
    @Body('role', new ParseEnumPipe(TeamMemberRole)) memberRole: TeamMemberRole,
    @GetUser('role') role: UserRole,
  ) {
    return this.teamsService.updateMemberRole(teamId, userId, role, memberRole);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async removeMember(
    @Param('id', ParseCuidPipe) teamId: string,
    @Param('userId', ParseCuidPipe) userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, userId, role);
  }

  @Get(':id/members')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getMembers(
    @Param('id', ParseCuidPipe) teamId: string,
    @Query() query: TeamsQueryDto,
    @GetUser('role') role: UserRole,
  ) {
    return this.teamsService.getTeamMembers(teamId, query, role);
  }
}
