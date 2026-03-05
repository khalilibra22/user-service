import { Expose, Transform } from "class-transformer";
import { getS3Url } from "../utils";

export class SubscriptionUserDto {
    @Expose()
    id?: string;

    @Expose()
    fullname?: string;

    @Expose()
    email?: string;

    @Expose()
    phoneNumber?: string;

    @Expose()
    @Transform(({ value }) => (value ? getS3Url(value) : undefined))
    profilePicture?: string;
}
