import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';

export interface ITagRepository {
  findAll(): Promise<TagEntity[]>;
}
