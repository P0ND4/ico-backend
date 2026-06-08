import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';

export interface IPathGenerationJobRepository {
  findByIdAndPathUserId(
    jobId: string,
    userId: string,
  ): Promise<PathGenerationJobEntity | null>;
  create(
    data: Partial<PathGenerationJobEntity>,
  ): Promise<PathGenerationJobEntity>;
  update(
    id: string,
    data: Partial<PathGenerationJobEntity>,
  ): Promise<PathGenerationJobEntity>;
}
