import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'cat', name: 'message_roles' })
export class MessageRoleEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;
}
