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
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { PATH_USE_CASE } from 'src/contexts/learning/domain/contracts/i-path.use-case';
import type { IPathUseCase } from 'src/contexts/learning/domain/contracts/i-path.use-case';
import { GeneratePathRequest } from '../requests/generate-path.request';
import { UpdatePathRequest } from '../requests/update-path.request';
import { PathListItemDto } from 'src/contexts/learning/application/dtos/path-list-item.dto';
import { PathDetailDto } from 'src/contexts/learning/application/dtos/path-detail.dto';
import { JobStatusDto } from 'src/contexts/learning/application/dtos/job-status.dto';

@ApiBearerAuth('access-token')
@ApiTags('Paths')
@Controller('v1/paths')
export class PathsController {
  constructor(
    @Inject(PATH_USE_CASE)
    private readonly pathUseCase: IPathUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all learning paths for the current user' })
  @ApiResponse({ status: 200, type: [PathListItemDto] })
  listPaths(@Request() req: { user: JwtPayload }) {
    return this.pathUseCase.list(req.user.sub);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new learning path with AI' })
  @ApiResponse({ status: 201, type: JobStatusDto })
  generatePath(
    @Request() req: { user: JwtPayload },
    @Body() body: GeneratePathRequest,
  ) {
    return this.pathUseCase.generate({
      userId: req.user.sub,
      topic: body.topic,
      mode: body.mode,
    });
  }

  @Get('jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the status of a path generation job' })
  @ApiResponse({ status: 200, type: JobStatusDto })
  getJobStatus(
    @Request() req: { user: JwtPayload },
    @Param('jobId') jobId: string,
  ) {
    return this.pathUseCase.getJobStatus(jobId, req.user.sub);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a learning path by ID' })
  @ApiResponse({ status: 200, type: PathDetailDto })
  getPath(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.pathUseCase.get(id, req.user.sub);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a learning path' })
  @ApiResponse({ status: 200, type: PathDetailDto })
  updatePath(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: UpdatePathRequest,
  ) {
    return this.pathUseCase.update({
      id,
      userId: req.user.sub,
      title: body.title,
      description: body.description,
      status: body.status,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a learning path' })
  @ApiResponse({ status: 204 })
  deletePath(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.pathUseCase.delete(id, req.user.sub);
  }
}
