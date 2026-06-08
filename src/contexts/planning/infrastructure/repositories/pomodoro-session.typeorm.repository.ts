import { Repository } from 'typeorm';
import { PomodoroSessionEntity } from 'src/contexts/shared/domain/entities/planning/pomodoro-session.entity';
import { IPomodoroSessionRepository } from '../../domain/ports/pomodoro-session.repository.port';

export class PomodoroSessionTypeOrmRepository implements IPomodoroSessionRepository {
  constructor(private readonly repo: Repository<PomodoroSessionEntity>) {}

  async findAllByUserId(
    userId: string,
    date?: string,
  ): Promise<PomodoroSessionEntity[]> {
    const qb = this.repo
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .orderBy('session.startedAt', 'DESC');

    if (date) {
      qb.andWhere('DATE(session.startedAt) = :date', { date });
    }

    return qb.getMany();
  }

  async create(
    data: Partial<PomodoroSessionEntity>,
  ): Promise<PomodoroSessionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
