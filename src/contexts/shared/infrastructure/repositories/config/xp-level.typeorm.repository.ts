import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import type { IXpLevelRepository } from 'src/contexts/shared/domain/repositories/config/xp-level.repository.interface';

@Injectable()
export class XpLevelTypeOrmRepository implements IXpLevelRepository {
  constructor(
    @InjectRepository(XpLevelEntity)
    private readonly repo: Repository<XpLevelEntity>,
  ) {}

  findAll(): Promise<XpLevelEntity[]> {
    return this.repo.find({ order: { level: 'ASC' } });
  }
}
