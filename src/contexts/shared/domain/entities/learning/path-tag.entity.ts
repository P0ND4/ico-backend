import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { LearningPathEntity } from './learning-path.entity';
import { TagEntity } from '../catalog/tag.entity';

@Entity({ schema: 'trn', name: 'path_tags' })
export class PathTagEntity {
  @PrimaryColumn({ type: 'uuid', name: 'path_id' })
  pathId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'tag_id' })
  tagId!: string;

  @ManyToOne(() => LearningPathEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'path_id' })
  path!: LearningPathEntity;

  @ManyToOne(() => TagEntity)
  @JoinColumn({ name: 'tag_id' })
  tag!: TagEntity;
}
