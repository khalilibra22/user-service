import { Expose } from "class-transformer";

export class UserContactInfoDto {
  // @Expose()
  // id?: string;

  @Expose()
  contactEmail?: string;

  @Expose()
  contactPhoneNumber?: string;

  @Expose()
  secondaryContactPhoneNumber?: string;

  @Expose()
  whatsappNumber?: string;

  @Expose()
  website?: string;
}
