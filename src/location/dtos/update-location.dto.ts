import { IsBoolean, IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  //   Latitude (vĩ độ)
  lat: number;

  @IsNumber()
  //   Longitude (kinh độ)
  lng: number;

  @IsBoolean()
  sharingEnabled: boolean;
}
