import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedAuthProviders } from './auth-providers.seed';
import { seedPathModes } from './path-modes.seed';
import { seedPathStatuses } from './path-statuses.seed';
import { seedJobStatuses } from './job-statuses.seed';
import { seedChapterStatuses } from './chapter-statuses.seed';
import { seedLessonTypes } from './lesson-types.seed';
import { seedMessageRoles } from './message-roles.seed';
import { seedSourceTypes } from './source-types.seed';
import { seedTags } from './tags.seed';
import { seedXpLevels } from './xp-levels.seed';
import { seedPomodoroPresets } from './pomodoro-presets.seed';
import { seedAppSettings } from './app-settings.seed';
import { seedSubscriptionPlans } from './subscription-plans.seed';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      // Catalog tables first (transactional tables reference them)
      await seedAuthProviders(this.ds);
      await seedPathModes(this.ds);
      await seedPathStatuses(this.ds);
      await seedJobStatuses(this.ds);
      await seedChapterStatuses(this.ds);
      await seedLessonTypes(this.ds);
      await seedMessageRoles(this.ds);
      await seedSourceTypes(this.ds);
      await seedTags(this.ds);
      // Config tables
      await seedXpLevels(this.ds);
      await seedPomodoroPresets(this.ds);
      await seedAppSettings(this.ds);
      await seedSubscriptionPlans(this.ds);

      this.logger.log('Seeder: done');
    } catch (err) {
      this.logger.error('Seeder: failed', err);
    }
  }
}
