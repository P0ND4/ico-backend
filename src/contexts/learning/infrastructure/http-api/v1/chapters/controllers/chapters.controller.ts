import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { CHAPTER_USE_CASE } from 'src/contexts/learning/domain/contracts/i-chapter.use-case';
import type { IChapterUseCase } from 'src/contexts/learning/domain/contracts/i-chapter.use-case';
import { CompleteChapterRequest } from '../requests/complete-chapter.request';
import { ChapterDetailDto } from 'src/contexts/learning/application/dtos/chapter-detail.dto';

@ApiBearerAuth('access-token')
@ApiTags('Chapters')
@Controller('v1/paths/:pathId/chapters')
export class ChaptersController {
  constructor(
    @Inject(CHAPTER_USE_CASE)
    private readonly chapterUseCase: IChapterUseCase,
  ) {}

  @Get(':chapterId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a chapter with its lessons' })
  @ApiResponse({ status: 200, type: ChapterDetailDto })
  getChapter(
    @Request() req: { user: JwtPayload },
    @Param('pathId') pathId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.chapterUseCase.get(pathId, chapterId, req.user.sub);
  }

  @Post(':chapterId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a chapter as completed and award XP' })
  @ApiResponse({ status: 200 })
  completeChapter(
    @Request() req: { user: JwtPayload },
    @Param('pathId') pathId: string,
    @Param('chapterId') chapterId: string,
    @Body() body: CompleteChapterRequest,
  ) {
    return this.chapterUseCase.complete({
      pathId,
      chapterId,
      userId: req.user.sub,
      earnedXp: body.earnedXp,
      correctCount: body.correctCount,
      totalQuestions: body.totalQuestions,
    });
  }
}
