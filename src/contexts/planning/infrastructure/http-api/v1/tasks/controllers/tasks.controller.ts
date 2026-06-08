import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { TASK_USE_CASE } from 'src/contexts/planning/domain/contracts/i-task.use-case';
import type { ITaskUseCase } from 'src/contexts/planning/domain/contracts/i-task.use-case';
import { CreateTaskRequest } from '../requests/create-task.request';
import { UpdateTaskRequest } from '../requests/update-task.request';

@ApiBearerAuth('access-token')
@ApiTags('Plan Tasks')
@Controller('plan/tasks')
export class TasksController {
  constructor(
    @Inject(TASK_USE_CASE)
    private readonly taskUseCase: ITaskUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all tasks for the current user' })
  listTasks(
    @Request() req: { user: JwtPayload },
    @Query('date') date?: string,
  ) {
    return this.taskUseCase.list({ userId: req.user.sub, date });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  createTask(
    @Request() req: { user: JwtPayload },
    @Body() body: CreateTaskRequest,
  ) {
    return this.taskUseCase.create({
      userId: req.user.sub,
      title: body.title,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a task by ID' })
  getTask(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.taskUseCase.get(id, req.user.sub);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a task' })
  updateTask(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: UpdateTaskRequest,
  ) {
    return this.taskUseCase.update({
      id,
      userId: req.user.sub,
      title: body.title,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      isCompleted: body.isCompleted,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  deleteTask(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.taskUseCase.delete(id, req.user.sub);
  }
}
