import { Module } from '@nestjs/common';
import { RecommendController } from './recommend.controller';
import { RecommendRepository } from './recommend.repository';
import { RecommendService } from './recommend.service';

@Module({
  controllers: [RecommendController],
  providers: [RecommendService, RecommendRepository],
})
export class RecommendModule {}
