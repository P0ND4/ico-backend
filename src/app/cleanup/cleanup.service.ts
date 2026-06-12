import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/auth/user.typeorm.repository';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';

const GUEST_INACTIVE_DAYS = 90;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly userRepo: UserTypeOrmRepository;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.userRepo = new UserTypeOrmRepository(
      dataSource.getRepository(UserEntity),
      dataSource.getRepository(UserAuthProviderEntity),
      dataSource,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupInactiveGuests(): Promise<void> {
    const cutoff = new Date(Date.now() - GUEST_INACTIVE_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await this.userRepo.deleteInactiveGuests(cutoff);
    if (deleted > 0) {
      this.logger.log(`Deleted ${deleted} inactive guest account(s) (inactive > ${GUEST_INACTIVE_DAYS} days)`);
    }
  }
}
