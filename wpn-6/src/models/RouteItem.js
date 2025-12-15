import { minutesToTime } from '../utils/time';

export class RouteItem {
  constructor(type, props) {
    this.type = type; // 'attraction' | 'break' | 'reservation'

    this.attraction = props.attraction || null;
    this.priority = props.priority || null; // attraction only

    this.travelMinutes = props.travelMinutes || 0;
    this.arrivalTimeMinutes = props.arrivalTimeMinutes || 0;
    this.departureTimeMinutes = props.departureTimeMinutes || 0;

    this.waitingMinutes = props.waitingMinutes || 0;
    this.waitingTimestamp = props.waitingTimestamp || null; // ISO string

    this.durationMinutes = props.durationMinutes || 0; // attraction duration or break duration

    this.order = props.order || 0;

    // breakのみ
    this.breakLabel = props.breakLabel || null;
    this.breakMemo = props.breakMemo || '';

    // reservationのみ
    this.reservationName = props.reservationName || null;
    this.reservationArea = props.reservationArea || null;
    this.reservationTimeMinutes = typeof props.reservationTimeMinutes === 'number' ? props.reservationTimeMinutes : null;
  }

  getArrivalTime() {
    return minutesToTime(this.arrivalTimeMinutes);
  }

  getDepartureTime() {
    return minutesToTime(this.departureTimeMinutes);
  }
}
