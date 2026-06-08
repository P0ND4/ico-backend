import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { IBaseRepository } from '../../domain/repositories/base-repository.interface';

export abstract class BaseTypeOrmRepository<
  T extends { id: ID },
  ID,
> implements IBaseRepository<T, ID> {
  constructor(protected readonly repository: Repository<T>) {}

  findById(id: ID): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
  }

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async update(id: ID, data: DeepPartial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = this.repository.merge(existing, data);
    return this.repository.save(merged);
  }

  async updateMany(ids: ID[], data: DeepPartial<T>): Promise<void> {
    const existing = await this.repository.findBy({
      id: In(ids),
    } as unknown as FindOptionsWhere<T>);
    const merged = existing.map((entity) =>
      this.repository.merge(entity, data),
    );
    await this.repository.save(merged);
  }

  async softDelete(id: ID): Promise<void> {
    await this.repository.softDelete({ id } as unknown as FindOptionsWhere<T>);
  }

  async softDeleteMany(ids: ID[]): Promise<void> {
    await this.repository.softDelete({
      id: In(ids),
    } as unknown as FindOptionsWhere<T>);
  }

  async hardDelete(id: ID): Promise<void> {
    await this.repository.delete({ id } as unknown as FindOptionsWhere<T>);
  }

  async hardDeleteMany(ids: ID[]): Promise<void> {
    await this.repository.delete({
      id: In(ids),
    } as unknown as FindOptionsWhere<T>);
  }
}
