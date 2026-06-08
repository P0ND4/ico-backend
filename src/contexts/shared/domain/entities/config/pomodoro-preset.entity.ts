import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'con', name: 'pomodoro_presets' })
export class PomodoroPresetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', name: 'duration_minutes', unique: true })
  durationMinutes!: number;

  @Column({ type: 'varchar', length: 50 })
  label!: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault!: boolean;

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;
}
