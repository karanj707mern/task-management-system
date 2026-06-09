import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { IPaginationQuery } from '@/common/types/common.types';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.createTeam(createTeamDto);
  }

  @Get()
  async getAllTeams(@Query() query: IPaginationQuery) {
    return this.teamsService.getAllTeams(query);
  }

  @Get(':id')
  async getTeam(@Param('id') id: string) {
    return this.teamsService.getTeam(id);
  }

  @Patch(':id')
  async updateTeam(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeam(@Param('id') id: string) {
    return this.teamsService.deleteTeam(id);
  }

  @Post(':id/members/:userId')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.teamsService.addMemberToTeam(teamId, userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, userId);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') teamId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.teamsService.getTeamMembers(teamId, query);
  }
}
