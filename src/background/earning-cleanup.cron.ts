import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { EarningModel } from "../models/earning.model";
import { UserWalletModel } from "../models/user-wallet.model";
import { EarningStatus } from "../enums/earning-status.enum";
import { LessThanOrEqual } from "typeorm";
import { getLogger } from "../utils/logger";

const log = getLogger();

/**
 * Release frozen earnings once they reach their release date.
 * Runs every day at midnight.
 */
export const releaseFrozenEarningsTask = cron.schedule("0 0 * * *", async () => {
    log.info("Running Release Frozen Earnings task");

    const earningRepo = AppDataSource.getRepository(EarningModel);
    const balanceRepo = AppDataSource.getRepository(UserWalletModel);

    try {
        // Find frozen earnings where releaseDate <= now
        const frozenEarnings = await earningRepo.find({
            where: {
                status: EarningStatus.FROZEN,
                releaseDate: LessThanOrEqual(new Date())
            },
            relations: ["teacher"]
        });

        if (frozenEarnings.length === 0) {
            log.info("No frozen earnings to release");
            return;
        }

        log.info({ count: frozenEarnings.length }, "Releasing frozen earnings");

        for (const earning of frozenEarnings) {
            await AppDataSource.transaction(async (transactionalEntityManager) => {
                // Update Earning Status
                earning.status = EarningStatus.WITHDRAWABLE;
                await transactionalEntityManager.save(earning);

                // Update Teacher Balance
                let balance = await transactionalEntityManager.findOne(UserWalletModel, {
                    where: { userId: earning.teacherId }
                });

                if (balance) {
                    balance.frozenBalance = Number(balance.frozenBalance) - Number(earning.amount);
                    balance.currentBalance = Number(balance.currentBalance) + Number(earning.amount);
                    await transactionalEntityManager.save(balance);
                } else {
                    log.error({ teacherId: earning.teacherId }, "User wallet not found during earning release");
                }
            });
        }

        log.info("Release Frozen Earnings task completed successfully");
    } catch (error) {
        log.error({ err: error }, "Error during Release Frozen Earnings task");
    }
});
