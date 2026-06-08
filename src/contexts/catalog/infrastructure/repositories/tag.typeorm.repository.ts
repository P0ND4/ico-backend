import { Repository } from 'typeorm';
import { TagEntity } from 'src/contexts/shared/domain/entities/catalog/tag.entity';
import { ITagRepository } from '../../domain/ports/tag.repository.port';

export class TagTypeOrmRepository implements ITagRepository {
  constructor(private readonly repo: Repository<TagEntity>) {}

  findAll(): Promise<TagEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}
