// src/location/location.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NearbyQueryDto } from './dtos/nearby-query.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { LocationService } from './location.service';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('me')
  update(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.locationService.updateLocation(
      user.sub,
      dto.lat,
      dto.lng,
      dto.sharingEnabled,
    );
  }

  @Get('nearby')
  nearby(@CurrentUser() user: any, @Query() query: NearbyQueryDto) {
    return this.locationService.getNearbyUsers(user.sub, query);
  }
}
