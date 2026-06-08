import { SummaryEntity } from 'src/contexts/shared/domain/entities/content/summary.entity';

export interface ISummaryRepository {
  findAllByUserId(userId: string): Promise<SummaryEntity[]>;
  findByIdAndUserId(id: string, userId: string): Promise<SummaryEntity | null>;
  create(data: Partial<SummaryEntity>): Promise<SummaryEntity>;
  delete(id: string): Promise<void>;
}
