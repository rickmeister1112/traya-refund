import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities';

@Controller('agents')
export class AgentController {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAgent(@Body() createAgentDto: any) {
    const agent = this.agentRepository.create(createAgentDto);
    return await this.agentRepository.save(agent);
  }

  @Get()
  async getAllAgents() {
    return await this.agentRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  async getAgent(@Param('id') id: string) {
    return await this.agentRepository.findOne({
      where: { id },
      relations: ['assignedTickets', 'processedTickets'],
    });
  }

  @Get(':id/workload')
  async getAgentWorkload(@Param('id') id: string) {
    const assignedToday = await this.agentRepository
      .createQueryBuilder('agent')
      .leftJoinAndSelect('agent.assignedTickets', 'ticket')
      .where('agent.id = :id', { id })
      .andWhere('DATE(ticket.createdAt) = CURDATE()')
      .getCount();

    const agent = await this.agentRepository.findOne({ where: { id } });

    return {
      agentId: id,
      assignedToday,
      maxDailyTickets: agent?.maxDailyTickets || 0,
      available: (agent?.maxDailyTickets || 0) - assignedToday,
      utilizationPercent:
        ((assignedToday / (agent?.maxDailyTickets || 1)) * 100).toFixed(2),
    };
  }

  @Get('available/least-loaded')
  async getLeastLoadedAgent() {
    const agents = await this.agentRepository.find({
      where: { isActive: true, role: 'complaints_agent' },
    });

    const agentWorkloads = await Promise.all(
      agents.map(async (agent) => {
        const workload = await this.getAgentWorkload(agent.id);
        return { agent, workload };
      }),
    );

    agentWorkloads.sort((a, b) => b.workload.available - a.workload.available);

    return agentWorkloads[0]?.agent || null;
  }

  @Patch(':id')
  async updateAgent(@Param('id') id: string, @Body() updateData: any) {
    await this.agentRepository.update(id, updateData);
    return await this.agentRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteAgent(@Param('id') id: string) {

    await this.agentRepository.softDelete(id);
    await this.agentRepository.update(id, { isActive: false });
    return { message: 'Agent soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreAgent(@Param('id') id: string) {
    await this.agentRepository.restore(id);
    await this.agentRepository.update(id, { isActive: true });
    return { message: 'Agent restored successfully' };
  }
}

