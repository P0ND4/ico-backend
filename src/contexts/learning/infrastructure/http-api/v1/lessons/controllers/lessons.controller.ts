import {
  Body,
  Controller,
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
import { LESSON_USE_CASE } from 'src/contexts/learning/domain/contracts/i-lesson.use-case';
import type { ILessonUseCase } from 'src/contexts/learning/domain/contracts/i-lesson.use-case';
import { AnswerLessonRequest } from '../requests/answer-lesson.request';

@ApiBearerAuth('access-token')
@ApiTags('Lessons')
@Controller('v1/paths/:pathId/chapters/:chapterId/lessons')
export class LessonsController {
  constructor(
    @Inject(LESSON_USE_CASE)
    private readonly lessonUseCase: ILessonUseCase,
  ) {}

  @Post(':lessonId/answer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a lesson answer' })
  @ApiResponse({ status: 201 })
  recordAnswer(
    @Request() req: { user: JwtPayload },
    @Param() params: { pathId: string; chapterId: string; lessonId: string },
    @Body() body: AnswerLessonRequest,
  ) {
    return this.lessonUseCase.recordAnswer({
      pathId: params.pathId,
      chapterId: params.chapterId,
      lessonId: params.lessonId,
      userId: req.user.sub,
      selectedIndex: body.selectedIndex,
      selectedAnswer: body.selectedAnswer,
      isCorrect: body.isCorrect,
    });
  }
}
