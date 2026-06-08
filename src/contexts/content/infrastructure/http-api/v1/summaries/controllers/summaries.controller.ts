import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { SUMMARY_USE_CASE } from 'src/contexts/content/domain/contracts/i-summary.use-case';
import type { ISummaryUseCase } from 'src/contexts/content/domain/contracts/i-summary.use-case';
import type { ExportFormat } from 'src/contexts/content/domain/contracts/i-summary.use-case';
import { GenerateSummaryRequest } from '../requests/generate-summary.request';

@ApiBearerAuth('access-token')
@ApiTags('Summaries')
@Controller('v1/summaries')
export class SummariesController {
  constructor(
    @Inject(SUMMARY_USE_CASE)
    private readonly summaryUseCase: ISummaryUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all summaries for the current user' })
  listSummaries(@Request() req: { user: JwtPayload }) {
    return this.summaryUseCase.list(req.user.sub);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a summary from text' })
  generateSummary(
    @Request() req: { user: JwtPayload },
    @Body() body: GenerateSummaryRequest,
  ) {
    return this.summaryUseCase.generate({
      userId: req.user.sub,
      text: body.text,
    });
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a file and generate a summary' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadAndSummarize(
    @Request() req: { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.summaryUseCase.uploadAndSummarize({
      userId: req.user.sub,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalname: file.originalname,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a summary by ID' })
  getSummary(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.summaryUseCase.get(id, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a summary' })
  deleteSummary(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.summaryUseCase.delete(id, req.user.sub);
  }

  @Get(':id/export')
  @ApiOperation({
    summary: 'Export a summary in the specified format (pdf, txt, docx)',
  })
  async exportSummary(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, filename } = await this.summaryUseCase.export({
      summaryId: id,
      userId: req.user.sub,
      format: (format as ExportFormat) ?? 'txt',
    });
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(buffer);
  }
}
