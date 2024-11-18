// src/pricing/entities/alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Alert {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    emailId: string;

    @Column('float')
    alertPrice: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
