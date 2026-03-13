import { AppDataSource } from "../config/database";
import { SubscriptionModel } from "../models/subscription.model";
import { getLogger } from "../utils/logger";
import axios from "axios";

const log = getLogger();

export interface QuotaResponse {
    hasActiveSubscription: boolean;
    subscriptionId?: number;
    subscriptionStart?: Date;
    subscriptionEnd?: Date;
    groupCourseLimit: number;
    liveCourseLimit: number;
    groupCoursesCreated: number;
    liveCoursesCreated: number;
    groupCourseRemaining: number;
    liveCourseRemaining: number;
    canCreateGroup: boolean;
    canCreateLive: boolean;
}

export class SubscriptionQuotaService {
    private subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);

    /**
     * Returns the quota status for a teacher (userId).
     * Counts how many group/live courses they've already created
     * during their current subscription period by querying course-service.
     */
    async getQuotaForUser(userId: string): Promise<QuotaResponse> {
        try {
            // Find the user's current active subscription with plan
            let subscription: SubscriptionModel | null = await this.subscriptionRepo.findOne({
                where: { user: { id: userId }, status: "active" },
                relations: ["plan"],
                order: { id: "DESC" },
                cache: false,
            });

            if (!subscription) {
                const { SubscriptionService } = await import("./subscription.service");
                const subscriptionService = new SubscriptionService();
                subscription = await subscriptionService.assignDefaultFreePlan(userId);
            }

            const NO_SUBSCRIPTION: QuotaResponse = {
                hasActiveSubscription: false,
                groupCourseLimit: 0,
                liveCourseLimit: 0,
                groupCoursesCreated: 0,
                liveCoursesCreated: 0,
                groupCourseRemaining: 0,
                liveCourseRemaining: 0,
                canCreateGroup: false,
                canCreateLive: false,
            };

            if (!subscription || !subscription.plan) {
                return NO_SUBSCRIPTION;
            }

            const groupLimit = subscription.plan.groupCourseCount ?? 0;
            const liveLimit = subscription.plan.liveCourseCount ?? 0;

            let sinceDate = subscription.startDate ?? new Date(0);
            const endDate = subscription.endDate ?? new Date();

            // Safety Buffer: If the DB server cluster has clock drift or is in a different timezone from the Node server without timezone mapping,
            // the DB's CURRENT_TIMESTAMP (used for courses.createdAt) may lag behind Node's new Date() (used for subscription.startDate).
            // By picking the earlier of the two for the start bounds, we guarantee we don't accidentally ignore courses created right after subscription.
            if (subscription.createdAt && subscription.createdAt < sinceDate) {
                // If they differ by more than a day, it's a renewal, so don't override. But if they are close, use createdAt.
                const diffHours = Math.abs(sinceDate.getTime() - subscription.createdAt.getTime()) / 3600000;
                if (diffHours < 24) {
                    sinceDate = subscription.createdAt;
                }
            }

            // Count how many group/live courses this teacher has created
            // during the current subscription period by calling course-service
            const { groupCreated, liveCreated } = await this.countCreatedCourses(
                userId,
                sinceDate,
                endDate
            );

            return {
                hasActiveSubscription: true,
                subscriptionId: subscription.id,
                subscriptionStart: subscription.startDate,
                subscriptionEnd: subscription.endDate,
                groupCourseLimit: groupLimit,
                liveCourseLimit: liveLimit,
                groupCoursesCreated: groupCreated,
                liveCoursesCreated: liveCreated,
                groupCourseRemaining: Math.max(0, groupLimit - groupCreated),
                liveCourseRemaining: Math.max(0, liveLimit - liveCreated),
                canCreateGroup: groupCreated < groupLimit,
                canCreateLive: liveCreated < liveLimit,
            };
        } catch (error) {
            log.error({ err: error, userId }, "Error getting quota for user");
            throw error;
        }
    }

    /**
     * Checks if a teacher can create a course of the given type.
     * Throws a descriptive error if quota is exceeded or no subscription.
     */
    async assertCanCreateCourse(userId: string, courseType: "group" | "live"): Promise<void> {
        const quota = await this.getQuotaForUser(userId);

        if (!quota.hasActiveSubscription) {
            throw new Error(
                `You need an active subscription to create ${courseType} courses.`
            );
        }

        if (courseType === "group" && !quota.canCreateGroup) {
            throw new Error(
                `Group course limit reached (${quota.groupCoursesCreated}/${quota.groupCourseLimit}). Upgrade your plan to create more group courses.`
            );
        }

        if (courseType === "live" && !quota.canCreateLive) {
            throw new Error(
                `Live course limit reached (${quota.liveCoursesCreated}/${quota.liveCourseLimit}). Upgrade your plan to create more live courses.`
            );
        }
    }

    /**
     * Calls course-service internal endpoint to count teacher's courses
     * created within the subscription period.
     */
    private async countCreatedCourses(
        teacherId: string,
        since: Date,
        until: Date
    ): Promise<{ groupCreated: number; liveCreated: number }> {
        try {
            const courseServiceUrl =
                process.env.COURSE_SERVICE_URL || "http://localhost:5001";

            const response = await axios.get(
                `${courseServiceUrl}/v1/inbounds/courses/teacher/${teacherId}/count`,
                {
                    params: {
                        since: since.toISOString(),
                        until: until.toISOString(),
                    },
                    headers: {
                        "x-internal-api-key": process.env.INBOUND_API_KEY || "12345",
                    },
                    timeout: 5000,
                }
            );

            return {
                groupCreated: response.data?.groupCount ?? 0,
                liveCreated: response.data?.liveCount ?? 0,
            };
        } catch (error: any) {
            log.error(
                { err: error?.message, teacherId },
                "Failed to count courses from course-service — defaulting to 0"
            );
            // Fail open: if course-service is unavailable, don't block creation
            return { groupCreated: 0, liveCreated: 0 };
        }
    }
}
