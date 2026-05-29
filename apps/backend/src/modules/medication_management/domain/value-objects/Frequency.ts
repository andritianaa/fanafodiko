import { AppError } from "@/core/errors/AppError";

export type FrequencyType = 'DAILY' | 'WEEKLY' | 'INTERVAL';

export interface FrequencyProps {
  type: FrequencyType;
  times: string[]; // Format "HH:mm"
  days?: string[]; // "MONDAY", "TUESDAY", etc. (Required for WEEKLY)
}

export class Frequency {
  private constructor(public readonly props: FrequencyProps) {}

  static create(props: FrequencyProps): Frequency {
    if (!['DAILY', 'WEEKLY', 'INTERVAL'].includes(props.type)) {
      throw new AppError("Invalid frequency type", 400, "INVALID_FREQUENCY_TYPE");
    }

    if (!props.times || props.times.length === 0) {
      throw new AppError("At least one time is required", 400, "INVALID_FREQUENCY_TIMES");
    }

    // Basic time format validation HH:mm
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
    for (const time of props.times) {
      if (!timeRegex.test(time)) {
        throw new AppError(`Invalid time format: ${time}`, 400, "INVALID_TIME_FORMAT");
      }
    }

    if (props.type === 'WEEKLY') {
      if (!props.days || props.days.length === 0) {
        throw new AppError("Days are required for WEEKLY frequency", 400, "INVALID_FREQUENCY_DAYS");
      }
      
      const validDays = new Set(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
      for (const day of props.days) {
        if (!validDays.has(day.toUpperCase())) {
          throw new AppError(`Invalid day: ${day}`, 400, "INVALID_DAY");
        }
      }
    }

    return new Frequency(props);
  }

  get type(): FrequencyType {
    return this.props.type;
  }

  get times(): string[] {
    return this.props.times;
  }

  get days(): string[] | undefined {
    return this.props.days;
  }
}
