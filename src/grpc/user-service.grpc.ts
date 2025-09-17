import * as grpc from '@grpc/grpc-js';
import { UserService } from '../services/user.service';
import { AcademicBackgroundService } from '../services/academicBackground.service';
import { AvailabilityService } from '../services/availability.service';
import { GrpcApiKeyMiddleware } from './middleware/api-key.middleware';
import { userProto, PROTO_PATH } from './config/setup';

export class GrpcUserService {
  private userService: UserService;
  private academicBackgroundService: AcademicBackgroundService;
  private availabilityService: AvailabilityService;

  constructor() {
    this.userService = new UserService();
    this.academicBackgroundService = new AcademicBackgroundService();
    this.availabilityService = new AvailabilityService();
  }

  // Convert database user to gRPC minimal user
  private toMinimalUser(user: any) {
    return {
      id: user.id || '',
      fullname: user.fullname || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      role: user.role || 0,
    };
  }

  // Convert user topic to gRPC format
  private toUserTopic(userTopic: any) {
    return {
      id: userTopic.id?.toString() || '',
      topic: {
        id: userTopic.topic?.id || 0,
        name: userTopic.topic?.name || '',
      },
      price: userTopic.price || 0,
    };
  }

  // Convert availability to gRPC format
  private toAvailability(availability: any) {
    return {
      id: availability.id || '',
      dayOfWeek: availability.dayOfWeek || '',
      startTime: availability.startTime || '',
      endTime: availability.endTime || '',
      isAvailable: availability.isAvailable || false,
      isActive: availability.isActive || false,
      isFree: availability.isFree || false,
    };
  }

  // Get single user by ID
  async getUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const { user_id } = call.request;
      
      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required'
        });
      }

      const user = await this.userService.getUserById(user_id);
      
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      }

      const response = this.toMinimalUser(user);
      callback(null, response);
    } catch (error: any) {
      console.error('gRPC GetUser error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get user by email
  async getUserByEmail(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const { email } = call.request;
      
      if (!email) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Email is required'
        });
      }

      const user = await this.userService.getUserByEmail(email);
      
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      }

      const response = this.toMinimalUser(user);
      callback(null, response);
    } catch (error: any) {
      console.error('gRPC GetUserByEmail error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get user topic
  async getUserTopic(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const { user_topic_id } = call.request;
      
      if (!user_topic_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User Topic ID is required'
        });
      }

      // Get user topic from academic background service
      const userTopic = await this.academicBackgroundService.getUserTopicById(user_topic_id);

      if (!userTopic) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User topic not found'
        });
      }

      const response = this.toUserTopic(userTopic);
      callback(null, response);
    } catch (error: any) {
      console.error('gRPC GetUserTopic error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Check availabilities by IDs - SECURED
  async checkAvailabilities(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    return GrpcApiKeyMiddleware.withApiKey(async (call, callback) => {
      try {
        const { availabilityIds } = call.request;

      if (!availabilityIds || !Array.isArray(availabilityIds)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Availability IDs array is required'
        });
      }

      if (availabilityIds.length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Availability IDs array cannot be empty'
        });
      }

      const availabilities = await Promise.all(
        availabilityIds.map(async (availabilityId: string) => {
          const availability = await this.availabilityService.getAvailabilityById(availabilityId);
          return availability;
        })
      );

      // Filter out null/undefined availabilities
      const validAvailabilities = availabilities.filter(
        (availability) => availability !== null && availability !== undefined
      );

      if (validAvailabilities.length !== availabilityIds.length) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: `Some availabilities not found. Found: ${validAvailabilities.length}, Requested: ${availabilityIds.length}`
        });
      }

      // Check if all availabilities are available
      const unavailableAvailabilities = validAvailabilities.filter(
        (availability) => !availability.isAvailable
      );
      if (unavailableAvailabilities.length > 0) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: `Some availabilities are not available. Unavailable count: ${unavailableAvailabilities.length}`
        });
      }

      const response = {
        availabilities: validAvailabilities.map(availability => this.toAvailability(availability))
      };

        callback(null, response);
      } catch (error: any) {
        console.error('gRPC CheckAvailabilities error:', error);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message || 'Internal server error'
        });
      }
    })(call, callback);
  }

  // Update availabilities to unavailable - SECURED
  async updateAvailabilitiesToUnavailable(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    return GrpcApiKeyMiddleware.withApiKey(async (call, callback) => {
      try {
        const { availabilityIds } = call.request;

      if (!availabilityIds || !Array.isArray(availabilityIds)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Availability IDs array is required'
        });
      }

      if (availabilityIds.length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Availability IDs array cannot be empty'
        });
      }

      const updatePromises = availabilityIds.map(async (availabilityId: string) => {
        const availability = await this.availabilityService.getAvailabilityById(availabilityId);
        if (availability) {
          const updateData = { ...availability, isAvailable: false };
          return await this.availabilityService.updateAvailability(updateData);
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      const updatedCount = results.filter((result) => result !== null).length;

      const response = {
        message: 'Availabilities updated successfully',
        updatedCount,
        requestedCount: availabilityIds.length,
      };

        callback(null, response);
      } catch (error: any) {
        console.error('gRPC UpdateAvailabilitiesToUnavailable error:', error);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message || 'Internal server error'
        });
      }
    })(call, callback);
  }

  // Health check - UNSECURED (for monitoring)
  async healthCheck(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const response = {
      status: 'SERVING',
      service: 'user-service',
      version: '1.0.0',
      apiKeysConfigured: GrpcApiKeyMiddleware.getConfiguredKeysCount()
    };
    callback(null, response);
  }

  // Get service definition for server
  getServiceDefinition() {
    return {
      GetUser: this.getUser.bind(this),
      GetUserByEmail: this.getUserByEmail.bind(this),
      GetUserTopic: this.getUserTopic.bind(this),
      CheckAvailabilities: this.checkAvailabilities.bind(this),
      UpdateAvailabilitiesToUnavailable: this.updateAvailabilitiesToUnavailable.bind(this),
      HealthCheck: this.healthCheck.bind(this),
    };
  }

  // Get proto service for server binding
  static getProtoService() {
   
    return userProto.UserService;
  }
}