import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'cat', name: 'lesson_types' })
export class LessonTypeEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;
}
