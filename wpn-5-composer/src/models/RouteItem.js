export class RouteItem {
  constructor(type, data = {}) {
    this.type = type; // 'attraction' or 'break'
    this.attraction = data.attraction || null;
    this.priority = data.priority || 'medium'; // 'high', 'medium', 'low'
    this.breakDuration = data.breakDuration || null;
    this.travelMinutes = data.travelMinutes || 0;
    this.arrivalTimeMinutes = data.arrivalTimeMinutes || 0;
    this.departureTimeMinutes = data.departureTimeMinutes || 0;
    this.waitingMinutes = data.waitingMinutes || 0;
    this.durationMinutes = data.durationMinutes || 0;
    this.order = data.order || 0;
  }

  isBreak() {
    return this.type === 'break';
  }

  isAttraction() {
    return this.type === 'attraction';
  }

  getTotalMinutes() {
    return this.travelMinutes + this.waitingMinutes + this.durationMinutes;
  }

  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  getArrivalTime() {
    return this.formatTime(this.arrivalTimeMinutes);
  }

  getDepartureTime() {
    return this.formatTime(this.departureTimeMinutes);
  }
}
