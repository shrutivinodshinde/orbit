import { IsString, Length } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  name: string;

  @IsString() @Length(2, 3)
  code: string;
}