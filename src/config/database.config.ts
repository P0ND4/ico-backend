import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { DeviceTrialEntity } from 'src/contexts/shared/domain/entities/auth/device-trial.entity';
import { UserPlanQuotaEntity } from 'src/contexts/shared/domain/entities/auth/user-plan-quota.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { AuthProviderEntity } from 'src/contexts/shared/domain/entities/catalog/auth-provider.entity';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import { PathModeEntity } from 'src/contexts/shared/domain/entities/catalog/path-mode.entity';
import { PathStatusEntity } from 'src/contexts/shared/domain/entities/catalog/path-status.entity';
import { JobStatusEntity } from 'src/contexts/shared/domain/entities/catalog/job-status.entity';
import { ChapterStatusEntity } from 'src/contexts/shared/domain/entities/catalog/chapter-status.entity';
import { LessonTypeEntity } from 'src/contexts/shared/domain/entities/catalog/lesson-type.entity';
import { MessageRoleEntity } from 'src/contexts/shared/domain/entities/catalog/message-role.entity';
import { SourceTypeEntity } from 'src/contexts/shared/domain/entities/catalog/source-type.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';
import { AppSettingsEntity } from 'src/contexts/shared/domain/entities/config/app-settings.entity';
import { PomodoroPresetEntity } from 'src/contexts/shared/domain/entities/config/pomodoro-preset.entity';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { PathTagEntity } from 'src/contexts/shared/domain/entities/learning/path-tag.entity';
import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';
import { ExamResultEntity } from 'src/contexts/shared/domain/entities/learning/exam-result.entity';
import { TutorConversationEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-conversation.entity';
import { TutorMessageEntity } from 'src/contexts/shared/domain/entities/tutor/tutor-message.entity';
import { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';
import { PlanTaskEntity } from 'src/contexts/shared/domain/entities/planning/plan-task.entity';
import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';

export const ALL_ENTITIES = [
  UserEntity,
  DeviceTrialEntity,
  UserPlanQuotaEntity,
  UserStatsEntity,
  UserAuthProviderEntity,
  AuthProviderEntity,
  TagEntity,
  PathModeEntity,
  PathStatusEntity,
  JobStatusEntity,
  ChapterStatusEntity,
  LessonTypeEntity,
  MessageRoleEntity,
  SourceTypeEntity,
  XpLevelEntity,
  SubscriptionPlanEntity,
  AppSettingsEntity,
  PomodoroPresetEntity,
  LearningPathEntity,
  PathTagEntity,
  PathGenerationJobEntity,
  ChapterEntity,
  LessonEntity,
  LessonAnswerEntity,
  ExamResultEntity,
  TutorConversationEntity,
  TutorMessageEntity,
  SummaryEntity,
  PlanTaskEntity,
  PomodoroSessionEntity,
];

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  database: configService.get<string>('DB_NAME', 'database'),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD'),
  entities: ALL_ENTITIES,
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: ['error'],
});
