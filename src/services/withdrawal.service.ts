import { injectable } from "tsyringe";
import { AppDataSource } from "../config/database";
import { WithdrawalModel } from "../models/withdrawal-request.model";
import { UserWalletModel } from "../models/user-wallet.model";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { PaymentMethodModel } from "../models/payment-method.model";
import { Repository, Between } from "typeorm";
import { getLogger } from "../utils/logger";

const log = getLogger();

@injectable()
export class WithdrawalService {
    private withdrawalRepo: Repository<WithdrawalModel>;
    private balanceRepo: Repository<UserWalletModel>;
    private paymentMethodRepo: Repository<PaymentMethodModel>;

    constructor() {
        this.withdrawalRepo = AppDataSource.getRepository(WithdrawalModel);
        this.balanceRepo = AppDataSource.getRepository(UserWalletModel);
        this.paymentMethodRepo = AppDataSource.getRepository(PaymentMethodModel);
    }

    async getTeacherBalance(teacherId: string): Promise<UserWalletModel | null> {
        return await this.balanceRepo.findOne({ where: { userId: teacherId } });
    }

    async requestWithdrawal(teacherId: string, amount: number, paymentMethodId: string): Promise<WithdrawalModel> {
        // 1. Validate Amount Limits
        if (amount < 2000) {
            throw new Error("Minimum requested amount to withdraw is 2000 DZD");
        }
        if (amount > 100000) {
            throw new Error("Maximum requested amount to withdraw is 100000 DZD");
        }

        // 2. Validate Withdrawal Frequency (1 per period)
        // Period 1: [1, 15], Period 2: [16, last day of month]
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();

        let startDate: Date;
        let endDate: Date;

        if (day <= 15) {
            // Period 1: 1st to 15th
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month, 15, 23, 59, 59);
        } else {
            // Period 2: 16th to last day
            startDate = new Date(year, month, 16);
            endDate = new Date(year, month + 1, 0, 23, 59, 59); // 0th day of next month is last day of current month
        }

        const existingRequest = await this.withdrawalRepo.findOne({
            where: {
                teacherId,
                createdAt: Between(startDate, endDate)
            }
        });

        if (existingRequest) {
            throw new Error("You can only submit one withdrawal request per period (1st-15th or 16th-End of Month)");
        }

        // 3. Validate Balance
        const balance = await this.balanceRepo.findOne({ where: { userId: teacherId } });
        if (!balance) throw new Error("Balance record not found for this teacher");

        if (Number(balance.currentBalance) < amount) {
            throw new Error("Insufficient withdrawable balance");
        }

        // 4. Validate Payment Method
        const paymentMethod = await this.paymentMethodRepo.findOne({
            where: { id: paymentMethodId, user: { id: teacherId }, isActived: true }
        });
        if (!paymentMethod) {
            throw new Error("Invalid or inactive payment method selected");
        }

        const fee = Number((amount * 0.01).toFixed(2));
        const netAmount = Number((amount - fee).toFixed(2));

        const withdrawal = new WithdrawalModel();
        withdrawal.teacherId = teacherId;
        withdrawal.amount = amount;
        withdrawal.fee = fee;
        withdrawal.netAmount = netAmount;
        withdrawal.paymentMethodId = paymentMethodId;
        withdrawal.status = WithdrawalStatus.PENDING;

        return await this.withdrawalRepo.save(withdrawal);

    }


    async getTeacherWithdrawals(teacherId: string): Promise<WithdrawalModel[]> {
        return await this.withdrawalRepo.find({
            where: { teacherId },
            order: { createdAt: "DESC" }
        });
    }

    // Admin Methods
    async getAllWithdrawalRequests(status?: WithdrawalStatus): Promise<WithdrawalModel[]> {
        const where: any = {};
        if (status) where.status = status;

        return await this.withdrawalRepo.find({
            where,
            relations: ["teacher"],
            order: { createdAt: "DESC" }
        });
    }

    async updateWithdrawalStatus(withdrawalId: string, status: WithdrawalStatus, adminNote?: string): Promise<WithdrawalModel> {
        const withdrawal = await this.withdrawalRepo.findOne({
            where: { id: withdrawalId },
            relations: ["teacher"]
        });
        if (!withdrawal) throw new Error("Withdrawal request not found");

        if (withdrawal.status === WithdrawalStatus.PAID || withdrawal.status === WithdrawalStatus.REJECTED) {
            throw new Error("Cannot update a completed withdrawal request");
        }

        // Handle balance deduction on approval or payment?
        // Standard: Deduct from 'currentBalance' when request is approved or paid.
        // I'll deduct when status changes to 'PAID' or 'APPROVED' depending on the flow.
        // Let's deduct from 'currentBalance' immediately when request is APPROVED or PAID to prevent double withdrawal.

        if (status === WithdrawalStatus.APPROVED || status === WithdrawalStatus.PAID) {
            const balance = await this.balanceRepo.findOne({ where: { userId: withdrawal.teacherId } });
            if (balance) {
                if (status === WithdrawalStatus.APPROVED && withdrawal.status === WithdrawalStatus.PENDING) {
                    // Deduct from balance when moving from Pending to Approved
                    balance.currentBalance = Number(balance.currentBalance) - Number(withdrawal.amount);
                    await this.balanceRepo.save(balance);
                } else if (status === WithdrawalStatus.PAID && withdrawal.status === WithdrawalStatus.PENDING) {
                    // Also handle case where it goes straight from Pending to Paid
                    balance.currentBalance = Number(balance.currentBalance) - Number(withdrawal.amount);
                    await this.balanceRepo.save(balance);
                }
            }
        } else if (status === WithdrawalStatus.REJECTED && withdrawal.status === WithdrawalStatus.APPROVED) {
            // Revert balance if rejected after being approved
            const balance = await this.balanceRepo.findOne({ where: { userId: withdrawal.teacherId } });
            if (balance) {
                balance.currentBalance = Number(balance.currentBalance) + Number(withdrawal.amount);
                await this.balanceRepo.save(balance);
            }
        }

        withdrawal.status = status;
        if (adminNote) withdrawal.adminNote = adminNote;

        return await this.withdrawalRepo.save(withdrawal);
    }
}
