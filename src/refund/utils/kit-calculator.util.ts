/**
 * Utility functions for calculating kit numbers and treatment progression
 * based on delivery dates instead of stored kit numbers
 */

export class KitCalculator {
  /**
   * Calculate which kit number an order belongs to based on delivery date
   * @param deliveryDate When the order was delivered
   * @param prescriptionStartDate When the treatment plan started
   * @param daysPerKit Days expected for each kit (default: 30)
   * @returns Kit number (1-based)
   */
  static calculateKitNumber(
    deliveryDate: Date,
    prescriptionStartDate: Date,
    daysPerKit: number = 30,
  ): number {
    if (!deliveryDate || !prescriptionStartDate) {
      return 0;
    }

    const daysSinceStart = this.getDaysDifference(
      prescriptionStartDate,
      deliveryDate,
    );

    if (daysSinceStart < 0) {
      return 0; // Order before prescription started
    }

    return Math.floor(daysSinceStart / daysPerKit) + 1;
  }

  /**
   * Get the number of days between two dates
   */
  static getDaysDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * Group orders by their calculated kit number
   * @returns Map of kitNumber -> orders
   */
  static groupOrdersByKit(
    orders: Array<{ deliveredAt: Date; [key: string]: any }>,
    prescriptionStartDate: Date,
    daysPerKit: number = 30,
  ): Map<number, any[]> {
    const kitGroups = new Map<number, any[]>();

    orders.forEach((order) => {
      const kitNumber = this.calculateKitNumber(
        order.deliveredAt,
        prescriptionStartDate,
        daysPerKit,
      );

      if (!kitGroups.has(kitNumber)) {
        kitGroups.set(kitNumber, []);
      }
      kitGroups.get(kitNumber).push(order);
    });

    return kitGroups;
  }

  /**
   * Get unique kit numbers from delivered orders
   * @returns Set of delivered kit numbers
   */
  static getDeliveredKitNumbers(
    orders: Array<{ deliveredAt: Date; isDelivered: boolean; [key: string]: any }>,
    prescriptionStartDate: Date,
    daysPerKit: number = 30,
  ): Set<number> {
    const deliveredKits = new Set<number>();

    orders
      .filter((order) => order.isDelivered && order.deliveredAt)
      .forEach((order) => {
        const kitNumber = this.calculateKitNumber(
          order.deliveredAt,
          prescriptionStartDate,
          daysPerKit,
        );
        if (kitNumber > 0) {
          deliveredKits.add(kitNumber);
        }
      });

    return deliveredKits;
  }

  /**
   * Calculate expected delivery date for a specific kit
   */
  static calculateExpectedKitDate(
    prescriptionStartDate: Date,
    kitNumber: number,
    daysPerKit: number = 30,
  ): Date {
    const expectedDate = new Date(prescriptionStartDate);
    expectedDate.setDate(expectedDate.getDate() + (kitNumber - 1) * daysPerKit);
    return expectedDate;
  }

  /**
   * Check if an order was delivered within the acceptable window for its kit
   * @param allowedDaysEarly Days before expected date (default: 5)
   * @param allowedDaysLate Days after expected date (default: 7)
   */
  static isOrderOnTime(
    deliveryDate: Date,
    prescriptionStartDate: Date,
    kitNumber: number,
    daysPerKit: number = 30,
    allowedDaysEarly: number = 5,
    allowedDaysLate: number = 7,
  ): { isOnTime: boolean; daysDifference: number; expectedDate: Date } {
    const expectedDate = this.calculateExpectedKitDate(
      prescriptionStartDate,
      kitNumber,
      daysPerKit,
    );

    const daysDifference = this.getDaysDifference(expectedDate, deliveryDate);

    const isOnTime =
      daysDifference >= -allowedDaysEarly &&
      daysDifference <= allowedDaysLate;

    return {
      isOnTime,
      daysDifference,
      expectedDate,
    };
  }

  /**
   * Calculate average days per kit based on actual delivery history
   */
  static calculateActualDaysPerKit(
    orders: Array<{ deliveredAt: Date; isDelivered: boolean }>,
  ): number {
    const deliveredOrders = orders
      .filter((o) => o.isDelivered && o.deliveredAt)
      .sort(
        (a, b) =>
          new Date(a.deliveredAt).getTime() -
          new Date(b.deliveredAt).getTime(),
      );

    if (deliveredOrders.length < 2) {
      return 30; // Default
    }

    const firstDelivery = new Date(deliveredOrders[0].deliveredAt);
    const lastDelivery = new Date(
      deliveredOrders[deliveredOrders.length - 1].deliveredAt,
    );

    const totalDays = this.getDaysDifference(firstDelivery, lastDelivery);
    const kitsDelivered = deliveredOrders.length - 1;

    return kitsDelivered > 0 ? Math.round(totalDays / kitsDelivered) : 30;
  }
}

