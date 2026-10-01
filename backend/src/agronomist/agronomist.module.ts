import { Module } from '@nestjs/common';
import { ServiceRequestModule } from '../service-request/service-request.module';
import { AgronomistController } from './agronomist.controller';
import { AgronomistService } from './agronomist.service';

@Module({ imports: [ServiceRequestModule], controllers: [AgronomistController], providers: [AgronomistService] })
export class AgronomistModule {}
