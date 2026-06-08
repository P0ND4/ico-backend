import { DeepPartial } from 'typeorm';

export interface IBaseRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: DeepPartial<T>): Promise<T>;
  createMany(data: DeepPartial<T>[]): Promise<T[]>;
  update(id: ID, data: DeepPartial<T>): Promise<T | null>;
  updateMany(ids: ID[], data: DeepPartial<T>): Promise<void>;
  softDelete(id: ID): Promise<void>;
  softDeleteMany(ids: ID[]): Promise<void>;
  hardDelete(id: ID): Promise<void>;
  hardDeleteMany(ids: ID[]): Promise<void>;
}
