import { Repository } from 'typeorm';
import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';
import { IPathGenerationJobRepository } from '../../domain/ports/path-generation-job.repository.port';

export class PathGenerationJobTypeOrmRepository implements IPathGenerationJobRepository {
  constructor(private readonly repo: Repository<PathGenerationJobEntity>) {}

  findByIdAndPathUserId(
    jobId: string,
    userId: string,
  ): Promise<PathGenerationJobEntity | null> {
    return this.repo
      .createQueryBuilder('job')
      .innerJoin('job.path', 'path')
      .where('job.id = :jobId', { jobId })
      .andWhere('path.userId = :userId', { userId })
      .getOne();
  }

  async create(
    data: Partial<PathGenerationJobEntity>,
  ): Promise<PathGenerationJobEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<PathGenerationJobEntity>,
  ): Promise<PathGenerationJobEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
