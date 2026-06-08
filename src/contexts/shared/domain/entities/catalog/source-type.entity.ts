import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'cat', name: 'source_types' })
export class SourceTypeEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;
}
