import { Expose } from "class-transformer";

export class PaymentMethodDto {
  @Expose()
  id?: string;

  @Expose()
  type?: string;

  @Expose()
  bankName?: string;

  @Expose()
  accountNumber?: string;

  @Expose()
  swiftCodeOrCcpKey?: string;

  @Expose()
  bankAddress?: string;

  @Expose()
  accountHolderName?: string;

  @Expose()
  isActived?: boolean;
}
