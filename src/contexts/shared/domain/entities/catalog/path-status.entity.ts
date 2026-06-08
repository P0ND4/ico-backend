import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'cat', name: 'path_statuses' })
export class PathStatusEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;
}
