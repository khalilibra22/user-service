import { Request, Response } from "express";
import { WithdrawalService } from "../services/withdrawal.service";
import { getLogger } from "../utils/logger";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";

const log = getLogger();

export class WithdrawalController {
    private withdrawalService: WithdrawalService;

    constructor() {
        this.withdrawalService = new WithdrawalService();
    }

    getTeacherBalance = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const balance = await this.withdrawalService.getTeacherBalance(userId);
            res.status(200).json(balance || { totalEarned: 0, currentBalance: 0, frozenBalance: 0 });
        } catch (error: any) {
            log.error({ err: error }, "Error getting teacher balance");
            res.status(500).json({ error: error.message });
        }
    }

    requestWithdrawal = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const { amount } = req.body;

            const withdrawal = await this.withdrawalService.requestWithdrawal(userId, amount);
            res.status(201).json(withdrawal);
        } catch (error: any) {
            log.error({ err: error }, "Error requesting withdrawal");
            res.status(400).json({ error: error.message });
        }
    }

    getTeacherWithdrawals = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const withdrawals = await this.withdrawalService.getTeacherWithdrawals(userId);
            res.status(200).json(withdrawals);
        } catch (error: any) {
            log.error({ err: error }, "Error getting teacher withdrawals");
            res.status(500).json({ error: error.message });
        }
    }

    // Admin Endpoints
    adminGetAllRequests = async (req: Request, res: Response): Promise<void> => {
        try {
            const { status } = req.query;
            const withdrawals = await this.withdrawalService.getAllWithdrawalRequests(status as WithdrawalStatus);
            res.status(200).json(withdrawals);
        } catch (error: any) {
            log.error({ err: error }, "Error getting all withdrawal requests");
            res.status(500).json({ error: error.message });
        }
    }

    adminUpdateStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, adminNote } = req.body;

            const updated = await this.withdrawalService.updateWithdrawalStatus(id, status as WithdrawalStatus, adminNote);
            res.status(200).json(updated);
        } catch (error: any) {
            log.error({ err: error }, "Error updating withdrawal status");
            res.status(400).json({ error: error.message });
        }
    }
}
