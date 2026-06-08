import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'cat', name: 'job_statuses' })
export class JobStatusEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;
}
