import { AppDataSource } from "../config/database";
import { WithdrawalModel } from "../models/withdrawal-request.model";
import { UserWalletModel } from "../models/user-wallet.model";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { Repository } from "typeorm";
import { getLogger } from "../utils/logger";

const log = getLogger();

export class WithdrawalService {
    private withdrawalRepo: Repository<WithdrawalModel>;
    private balanceRepo: Repository<UserWalletModel>;

    constructor() {
        this.withdrawalRepo = AppDataSource.getRepository(WithdrawalModel);
        this.balanceRepo = AppDataSource.getRepository(UserWalletModel);
    }

    async getTeacherBalance(teacherId: string): Promise<UserWalletModel | null> {
        return await this.balanceRepo.findOne({ where: { userId: teacherId } });
    }

    async requestWithdrawal(teacherId: string, amount: number): Promise<WithdrawalModel> {
        const balance = await this.balanceRepo.findOne({ where: { userId: teacherId } });
        if (!balance) throw new Error("Balance record not found for this teacher");

        if (Number(balance.currentBalance) < amount) {
            throw new Error("Insufficient withdrawable balance");
        }

        const withdrawal = new WithdrawalModel();
        withdrawal.teacherId = teacherId;
        withdrawal.amount = amount;
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
