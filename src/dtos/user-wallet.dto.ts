import { Expose } from "class-transformer";

export class UserWalletDto {
    @Expose()
    userId!: string;

    @Expose()
    totalEarned!: number;

    @Expose()
    currentBalance!: number;

    @Expose()
    frozenBalance!: number;
}
