

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  REPORT: 'report',
} as const;

export const QUEUE_CONFIGS = {
  email: {
    name: QUEUE_NAMES.EMAIL,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    },
  },
  notification: {
    name: QUEUE_NAMES.NOTIFICATION,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: true,
    },
  },
  report: {
    name: QUEUE_NAMES.REPORT,
    defaultJobOptions: {
      attempts: 2,
      removeOnComplete: true,
    },
  },
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface QueueMetrics {
  count: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}