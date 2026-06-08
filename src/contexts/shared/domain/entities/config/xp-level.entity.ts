import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'con', name: 'xp_levels' })
export class XpLevelEntity {
  @PrimaryColumn({ type: 'int' })
  level!: number;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'int', name: 'min_xp' })
  minXp!: number;

  @Column({ type: 'int', name: 'max_xp' })
  maxXp!: number;
}
