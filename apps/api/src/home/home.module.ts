/**
 * 홈(추첨·당첨) API 기능을 Nest에 등록하는 묶음입니다.
 * controller·service만 연결하고, 다른 기능 모듈과는 app.module에서 나란히 켜집니다.
 */
import { Module } from '@nestjs/common';
import { DrawingsController } from './controller/drawings.controller';
import { DrawingsService } from './service/drawings.service';

@Module({
  controllers: [DrawingsController],
  providers: [DrawingsService],
})
export class HomeModule {}
