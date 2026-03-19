import { Expose, Type } from "class-transformer";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { PaymentMethodDto } from "./payment-method.dto";
import { UserDto } from "./user.dto";

export class WithdrawalDto {
    @Expose()
    id!: string;

    @Expose()
    @Type(() => UserDto)
    teacher?: UserDto;

    @Expose()
    teacherId!: string;

    @Expose()
    amount!: number;

    @Expose()
    fee!: number;

    @Expose()
    netAmount!: number;

    @Expose()
    status!: WithdrawalStatus;

    @Expose()
    adminNote?: string;

    @Expose()
    @Type(() => PaymentMethodDto)
    paymentMethod?: PaymentMethodDto;

    @Expose()
    paymentMethodId!: string;

    @Expose()
    createdAt!: Date;

    @Expose()
    updatedAt!: Date;
}
