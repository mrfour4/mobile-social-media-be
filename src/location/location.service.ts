// src/location/location.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NearbyQueryDto } from './dtos/nearby-query.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateLocation(
    userId: string,
    lat: number,
    lng: number,
    sharingEnabled: boolean,
  ) {
    const location = await this.prisma.userLocation.upsert({
      where: { userId },
      update: { lat, lng, sharingEnabled },
      create: { userId, lat, lng, sharingEnabled },
    });

    return location;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getNearbyUsers(userId: string, query: NearbyQueryDto) {
    const myLocation = await this.prisma.userLocation.findUnique({
      where: { userId },
    });

    if (!myLocation || !myLocation.sharingEnabled) {
      return [];
    }

    const others = await this.prisma.userLocation.findMany({
      where: {
        userId: { not: userId },
        sharingEnabled: true,
      },
      include: {
        user: true,
      },
    });

    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    const blockedUserIds = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId === userId) blockedUserIds.add(b.blockedId);
      if (b.blockedId === userId) blockedUserIds.add(b.blockerId);
    }

    const result: unknown[] = [];

    for (const loc of others) {
      if (blockedUserIds.has(loc.userId)) continue;

      const distance = this.distanceKm(
        myLocation.lat,
        myLocation.lng,
        loc.lat,
        loc.lng,
      );

      if (distance <= query.radiusKm) {
        result.push({
          userId: loc.userId,
          name: loc.user.name,
          avatarUrl: loc.user.avatarUrl,
          lat: loc.lat,
          lng: loc.lng,
          distanceKm: Math.round(distance * 100) / 100,
        });
      }
    }

    return result;
  }
}
